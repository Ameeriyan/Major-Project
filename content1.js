// Array of valid emails and passwords
const validEmails = [
  'test@gmail.com',
  'student@rguktn.ac.in',
  'user123@outlook.com',
  'admin@yahoo.com',
  'EXAMPLE@GMAIL.COM',
  'TestUser@Rguktn.Ac.In'
];

const validPasswords = [
  'Password123',
  'SecurePass1',
  'HelloWorld2',
  'MyPassword99'
];

// Email and password validation functions
function isValidEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email) || validEmails.some(valid => valid.toLowerCase() === email.toLowerCase());
}

function isValidPassword(password) {
  return validPasswords.includes(password);
}

// Form submission event listener
document.addEventListener('submit', (event) => {
  const form = event.target;
  const emailField = form.querySelector('input[name="email"], input[name="mail"]');
  const passwordField = form.querySelector('input[name="pass"]');

  if (emailField && passwordField) {
      const email = emailField.value;
      const password = passwordField.value;

      let hasError = false;

      if (!isValidEmail(email)) {
          event.preventDefault();
          showError('Invalid email format. Please use a valid email.', emailField);
          redirectToStackOverflow('Invalid email format error', 'main.js');
          hasError = true;
      } 
      
      if (!isValidPassword(password)) {
          event.preventDefault();
          showError('Invalid password format. Please use a valid password.', passwordField);
          redirectToStackOverflow('Invalid password format error', 'main.js');
          hasError = true;
      }

      if (hasError) {
          console.log('Form submission halted due to validation errors.');
      }
  }
});

// Show error message
function showError(message, element) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'validation-error';
  errorDiv.textContent = message;
  element.parentNode.insertBefore(errorDiv, element.nextSibling);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Redirect to Stack Overflow with a search query based on the error
function redirectToStackOverflow(errorType, fileName) {
  const searchQuery = encodeURIComponent(`${errorType} in ${fileName}`);
  chrome.runtime.sendMessage({ action: "openStackOverflow", query: searchQuery });
}

