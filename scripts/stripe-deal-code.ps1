<#
.SYNOPSIS
  Creates one venue promotion code on the shared "deals 2026-09" coupon in LIVE Stripe.
  Optionally creates the coupon itself (once) and enables promotion codes on the
  Growth PRO monthly payment link (once).

.DESCRIPTION
  Written 2026-09-08 for packet 023 (docs: .claude/handoffs/023-...). Constantin runs
  this by hand; agents may not write to live Stripe. The script builds the argument
  list itself so PowerShell quoting cannot mangle the values, and it hides the
  npm shim's "claude-code-hint" line that PowerShell 5.1 paints red.

  Offer, ruled 2026-09-08: 50 percent off, first 3 months, monthly plans only
  (annual links never accept codes), first purchase only, 100 redemptions per
  code, no expiry (switched off by hand after the campaign).

.EXAMPLE
  # First run, once: coupon + Uneed code + the Growth PRO link flag
  .\scripts\stripe-deal-code.ps1 -Code UNEED50 -Channel uneed -CreateCoupon -EnableGrowthProLink

.EXAMPLE
  # Every later venue: one code each
  .\scripts\stripe-deal-code.ps1 -Code PH50 -Channel producthunt

.EXAMPLE
  # See exactly what would run, without touching Stripe
  .\scripts\stripe-deal-code.ps1 -Code UNEED50 -Channel uneed -CreateCoupon -DryRun
#>
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[A-Z0-9]{3,20}$')][string]$Code,
  [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9-]{2,40}$')][string]$Channel,
  [switch]$CreateCoupon,
  [switch]$EnableGrowthProLink,
  [switch]$DryRun
)

$CouponId = 'UNEED50'
$GrowthProMonthlyLink = 'plink_1TzvvK63lspobjfOp4kSb2Ab'
$Products = @(
  'prod_UzvlUFXpVdx5gH',  # Radar
  'prod_UzvlFTnW6bABSk',  # Essentials
  'prod_UzvlxjmdB6Idcq',  # Growth
  'prod_UzvlfrHiEwNF5V'   # Growth PRO
)

function Invoke-Stripe {
  param([string[]]$StripeArgs)
  if ($DryRun) {
    Write-Host ('stripe ' + ($StripeArgs -join ' '))
    return
  }
  # 2>&1 merges the shim's stderr hint into the pipeline; drop it, print the rest.
  $out = & stripe @StripeArgs 2>&1 | ForEach-Object { "$_" } | Where-Object { $_ -notmatch 'claude-code-hint' }
  $out
  if ($LASTEXITCODE -ne 0) {
    Write-Host "stripe exited with code $LASTEXITCODE" -ForegroundColor Red
  }
}

if ($CreateCoupon) {
  $couponArgs = @(
    'coupons', 'create', '--live',
    '-d', "id=$CouponId",
    '-d', 'name=Deals 2026-09, 50 percent off for 3 months',
    '-d', 'percent_off=50',
    '-d', 'duration=repeating',
    '-d', 'duration_in_months=3',
    '-d', 'metadata[program]=deals-2026-09',
    '-d', 'metadata[ruled]=2026-09-08'
  )
  for ($i = 0; $i -lt $Products.Count; $i++) {
    $couponArgs += @('-d', "applies_to[products][$i]=$($Products[$i])")
  }
  Write-Host "== coupon $CouponId ==" -ForegroundColor Cyan
  Invoke-Stripe $couponArgs
}

$codeArgs = @(
  'promotion_codes', 'create', '--live',
  '-d', "coupon=$CouponId",
  '-d', "code=$Code",
  '-d', 'max_redemptions=100',
  '-d', 'restrictions[first_time_transaction]=true',
  '-d', "metadata[channel]=$Channel",
  '-d', 'metadata[program]=deals-2026-09'
)
Write-Host "== promotion code $Code for $Channel ==" -ForegroundColor Cyan
Invoke-Stripe $codeArgs

if ($EnableGrowthProLink) {
  Write-Host "== Growth PRO monthly link accepts codes ==" -ForegroundColor Cyan
  Invoke-Stripe @('payment_links', 'update', $GrowthProMonthlyLink, '--live', '-d', 'allow_promotion_codes=true')
}
