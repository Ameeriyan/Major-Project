let currentErrors = [];
let displayErrors = [];
let currentErrorIndex = 0;
let currentUrl = '';

async function runValidation() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentUrl = tab.url;
  
  // Store the current URL for Display.html
  chrome.storage.local.set({ 'currentUrl': currentUrl });
  
  // First validate HTML
  await validateHTML(tab);
  
  // Then validate associated resources (CSS, JS)
  await validateResources(tab);
}

async function validateHTML(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: validatePageContent,
  }, (results) => {
    if (!results || !results[0]) {
      handleError("Could not validate page content");
      return;
    }
    
    currentErrors = results[0].result;
    currentErrorIndex = 0;
    updateDisplay();
  });
}

function updateDisplay() {
    const resultsDiv = document.getElementById("results");
    const showAllErrorsButton = document.getElementById('showAllErrors');
    const errorCounter = document.querySelector('.error-counter');
    const sliderContainer = document.querySelector('.slider-container');
    
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = "";
    
    // Store all errors
    displayErrors = [...currentErrors]; // Save all errors for Display.html
    
    // Always limit popup display to only first 2 errors
    const popupErrors = currentErrors.slice(0, 2);
    
    if (popupErrors.length > 0) {
        // Show current error (either 1st or 2nd)
        const error = popupErrors[currentErrorIndex];
        const errorDiv = document.createElement('div');
        
        // Display single error
        const stackoverflowUrl = `https://stackoverflow.com/search?q=${encodeURIComponent(error.message)}`;
        errorDiv.innerHTML = `
            <div class="error">
                <a href="${stackoverflowUrl}" target="_blank" class="error-link">
                    ${error.message}
                </a>
            </div>
        `;
        resultsDiv.appendChild(errorDiv);
        
        // Show navigation if there are 2 errors
        if (popupErrors.length === 2) {
            if (sliderContainer) {
                sliderContainer.style.display = 'block';
            }
            if (errorCounter) {
                errorCounter.textContent = `${currentErrorIndex + 1} out of 2`;
            }
            
            // Show "Click Here" button ONLY when showing second error (2 out of 2)
            if (showAllErrorsButton && currentErrorIndex === 1) {
                showAllErrorsButton.style.display = 'block';
                // Add attention-grabbing message
                const messageDiv = document.createElement('div');
                messageDiv.className = 'click-here-message';
                messageDiv.innerHTML = 'To Make Your Website Error-Free:<br>Click Below:';
                resultsDiv.appendChild(messageDiv);
                showAllErrorsButton.textContent = 'Click Here';
                showAllErrorsButton.classList.add('attention');
            } else {
                showAllErrorsButton.style.display = 'none';
                const existingMessage = document.querySelector('.click-here-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
                showAllErrorsButton.classList.remove('attention');
            }
        } else {
            if (sliderContainer) {
                sliderContainer.style.display = 'none';
            }
            if (showAllErrorsButton) {
                showAllErrorsButton.style.display = 'none';
            }
        }
    } else {
        resultsDiv.innerHTML = `<div class="no-error">No errors found.</div>`;
        if (sliderContainer) sliderContainer.style.display = 'none';
        if (showAllErrorsButton) showAllErrorsButton.style.display = 'none';
    }
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Store all errors for Display.html
    chrome.storage.local.set({ 
        'validationErrors': displayErrors,
        'currentUrl': currentUrl 
    });
}

// Update navigation buttons to only work with 2 errors max
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevError');
    const nextButton = document.getElementById('nextError');
    
    if (prevButton) {
        prevButton.disabled = currentErrorIndex === 0;
    }
    if (nextButton) {
        nextButton.disabled = currentErrorIndex === 1 || currentErrors.length < 2;
    }
}

// Navigation event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('prevError')?.addEventListener('click', () => {
        if (currentErrorIndex > 0) {
            currentErrorIndex--;
            updateDisplay();
        }
    });

    document.getElementById('nextError')?.addEventListener('click', () => {
        if (currentErrorIndex < 1) { // Limit to showing only first 2 errors
            currentErrorIndex++;
            updateDisplay();
        }
    });
});

function handleError(message) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `<div class="error">Error: ${message}</div>`;
}

async function validateResources(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getLinkedResources,
  }, async (results) => {
    if (!results || !results[0]) return;

    const resources = results[0].result;
    
    for (const resource of resources) {
      try {
        const response = await fetch(resource.url);
        const content = await response.text();
        
        if (resource.type === 'css') {
          validateCSSContent(content, resource.url);
        } else if (resource.type === 'javascript') {
          validateJSContent(content, resource.url);
        }
      } catch (error) {
        currentErrors.push({
          message: `[${resource.type.toUpperCase()}] Failed to load: ${resource.url}`,
          fileType: resource.type.toUpperCase()
        });
      }
    }
    
    updateDisplay();
  });
}

function getLinkedResources() {
  const resources = [];
  
  // Get CSS files
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    resources.push({
      url: link.href,
      type: 'css'
    });
  });
  
  // Get JavaScript files
  document.querySelectorAll('script[src]').forEach(script => {
    resources.push({
      url: script.src,
      type: 'javascript'
    });
  });
  
  return resources;
}

function validateCSSContent(content, url) {
  const cssErrors = [];
  
  // Enhanced CSS validations
  if (content.includes('position: fixed') && !content.includes('z-index')) {
    cssErrors.push({
      message: `[CSS] Fixed position without z-index`,
      fileType: "CSS",
      url: url
    });
  }

  // Check for !important usage
  const importantCount = (content.match(/!important/g) || []).length;
  if (importantCount > 3) {
    cssErrors.push({
      message: `[CSS] Excessive use of !important (${importantCount} times)`,
      fileType: "CSS",
      url: url
    });
  }

  // Check for potential vendor prefix issues
  const vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
  vendorPrefixes.forEach(prefix => {
    if (content.includes(prefix) && !content.includes('@supports')) {
      cssErrors.push({
        message: `[CSS] Vendor prefix ${prefix} used without @supports`,
        fileType: "CSS",
        url: url
      });
    }
  });
  
  currentErrors = [...currentErrors, ...cssErrors];
}

function validateJSContent(content, url) {
  const jsErrors = [];
  
  // Enhanced JavaScript validations
  if (content.includes('var ')) {
    jsErrors.push({
      message: `[JavaScript] Use of 'var' keyword found`,
      fileType: "JavaScript",
      url: url
    });
  }

  // Check for console.log in production
  if (content.includes('console.log(')) {
    jsErrors.push({
      message: `[JavaScript] console.log statements found`,
      fileType: "JavaScript",
      url: url
    });
  }

  // Check for eval usage
  if (content.includes('eval(')) {
    jsErrors.push({
      message: `[JavaScript] Dangerous eval() usage detected`,
      fileType: "JavaScript",
      url: url
    });
  }

  // Check for proper error handling
  if (content.includes('try {') && !content.includes('catch')) {
    jsErrors.push({
      message: `[JavaScript] Incomplete try/catch block`,
      fileType: "JavaScript",
      url: url
    });
  }
  
  currentErrors = [...currentErrors, ...jsErrors];
}

function validatePageContent() {
    const errors = [];
    
    // URL Specific Validation
    function validateURLSpecific(errors) {
        const currentURL = window.location.href;
        
        if (currentURL.includes('login') || currentURL.includes('Login')) {
            const loginForm = document.querySelector('form');
            if (!loginForm) {
                errors.push({
                    message: "[HTML/Login] Login form not found",
                    fileType: "Login.html",
                    category: "Structure"
                });
            }
        }

        if (currentURL.includes('register') || currentURL.includes('Register')) {
            const registerForm = document.querySelector('form');
            if (!registerForm) {
                errors.push({
                    message: "[HTML/Register] Registration form not found",
                    fileType: "Register.html",
                    category: "Structure"
                });
            }
        }
    }

    // Basic Structure Validation
    function validateBasicStructure(errors) {
        // DOCTYPE check
        const doctype = document.doctype;
        if (!doctype) {
            errors.push({
                message: "[HTML] Missing DOCTYPE declaration",
                fileType: "Login.html/Register.html",
                category: "Structure"
            });
        }

        // Viewport meta tag
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            errors.push({
                message: "[HTML/Meta] Missing viewport meta tag",
                fileType: "Login.html/Register.html",
                category: "Meta"
            });
        }

        // CSS file check
        const cssLink = document.querySelector('link[href*="Login.css"], link[href*="Register.css"]');
        if (!cssLink) {
            errors.push({
                message: "[CSS] Style sheet not linked",
                fileType: "Login.css/Register.css",
                category: "Resource"
            });
        }

        // JavaScript file check
        const jsScript = document.querySelector('script[src*="Login.js"], script[src*="Register.js"]');
        if (!jsScript) {
            errors.push({
                message: "[JavaScript] Script file not linked",
                fileType: "Login.js/Register.js",
                category: "Resource"
            });
        }
    }

    // Form Validation
    function validateForm(errors) {
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            if (!form.id) {
                errors.push({
                    message: `[HTML/Form] Form #${index + 1} missing ID attribute`,
                    fileType: "Login.html/Register.html",
                    category: "Form"
                });
            }

            // Check form action
            if (!form.hasAttribute('action')) {
                errors.push({
                    message: `[HTML/Form] Form missing action attribute`,
                    fileType: "Login.html/Register.html",
                    category: "Form"
                });
            }
        });
    }

    // Input Fields Validation
    function validateInputFields(errors) {
        const inputs = document.querySelectorAll('input');
        inputs.forEach((input, index) => {
            if (!input.getAttribute('name')) {
                errors.push({
                    message: `[HTML/Input] Input field missing name attribute`,
                    fileType: "Login.html/Register.html",
                    category: "Input"
                });
            }

            // Email field validation
            if (input.type === 'email' || input.name === 'email') {
                if (!input.hasAttribute('required')) {
                    errors.push({
                        message: "[HTML/Input] Email field missing required attribute",
                        fileType: "Login.html/Register.html",
                        category: "Input"
                    });
                }
            }

            // Password field validation
            if (input.type === 'password') {
                if (!input.hasAttribute('minlength')) {
                    errors.push({
                        message: "[HTML/Input] Password field missing minlength attribute",
                        fileType: "Login.html/Register.html",
                        category: "Input"
                    });
                }
            }
        });
    }

    // CSS Validation
    function validateStyles(errors) {
        const styles = document.styleSheets;
        for (let sheet of styles) {
            try {
                if (sheet.href && (sheet.href.includes('Login.css') || sheet.href.includes('Register.css'))) {
                    errors.push({
                        message: "[CSS] Check responsive design rules",
                        fileType: "Login.css/Register.css",
                        category: "Style"
                    });
                }
            } catch (e) {
                errors.push({
                    message: "[CSS] Style sheet access error",
                    fileType: "Login.css/Register.css",
                    category: "Style"
                });
            }
        }
    }

    // JavaScript Validation
    function validateScripts(errors) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src && (script.src.includes('Login.js') || script.src.includes('Register.js'))) {
                errors.push({
                    message: "[JavaScript] Check form validation implementation",
                    fileType: "Login.js/Register.js",
                    category: "Script"
                });
            }
        });
    }

    try {
        validateURLSpecific(errors);
        validateBasicStructure(errors);
        validateForm(errors);
        validateInputFields(errors);
        validateStyles(errors);
        validateScripts(errors);
        validateAccessibility(errors);
        
        // Return all errors without slicing
        return errors;
    } catch (error) {
        return [{
            message: `[System] Validation failed: ${error.message}`,
            fileType: "System",
            category: "Error"
        }];
    }
}

// New accessibility validation function
function validateAccessibility(errors) {
  // Check for alt text on images
  document.querySelectorAll('img').forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      errors.push({
        message: `[Accessibility] Image #${index + 1} missing alt text`,
        fileType: "Accessibility"
      });
    }
  });

  // Check for ARIA labels on interactive elements
  document.querySelectorAll('button, input, select, textarea').forEach((element, index) => {
    if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
      errors.push({
        message: `[Accessibility] Interactive element #${index + 1} missing ARIA label`,
        fileType: "Accessibility"
      });
    }
  });
}

// Initialize validation
document.addEventListener('DOMContentLoaded', runValidation);
document.getElementById("runValidation")?.addEventListener("click", runValidation);

// Update the click handler for showAllErrors
document.getElementById('showAllErrors')?.addEventListener('click', () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('files/Display.html')
    }, (tab) => {
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'validationErrors',
                errors: displayErrors, // Send all errors
                currentUrl: currentUrl,
                totalErrors: displayErrors.length
            });
        }, 500);
    });
});

