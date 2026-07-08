(function() {
  function toggleFaq(btn) {
    var answer = btn.nextElementSibling;
    var isOpen = btn.classList.contains('open');
    document.querySelectorAll('.faq-question.open').forEach(function(b) {
      b.classList.remove('open');
      b.nextElementSibling.classList.remove('open');
    });
    if (!isOpen) {
      btn.classList.add('open');
      answer.classList.add('open');
    }
  }

  var questions = document.querySelectorAll('.faq-question');
  questions.forEach(function(btn) {
    btn.addEventListener('click', function() { toggleFaq(btn); });
  });

  // Auto-open first FAQ on page load
  if (questions.length > 0) questions[0].click();
})();
