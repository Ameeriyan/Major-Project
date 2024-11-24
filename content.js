// Developer Training Tools and Validation Configuration
const DEV_CONFIG = {
    debugMode: true,
    showHints: true,
    autoComplete: true,
    validationDelay: 500,
    maxAttempts: 3
};

// Enhanced validation patterns with explanations
const VALIDATION_PATTERNS = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        explanation: 'Email format: username@domain.com',
        examples: ['user@gmail.com', 'name.surname@company.co.uk']
    },
    password: {
        pattern: /^.{8,}$/,
        explanation: 'Password requirements: Minimum 8 characters',
        examples: ['Password123', 'SecurePass1']
    }
};

// Developer hints and suggestions
const DEV_HINTS = {
    email: [
        'Try using a valid email format',
        'Common domains: gmail.com, outlook.com',
        'Check for typos in domain name'
    ],
    password: [
        'Include at least one uppercase letter',
        'Include at least one number',
        'Minimum length is 8 characters'
    ]
};

// Code examples for developers
const CODE_EXAMPLES = {
    emailValidation: `
// Example email validation:
function validateEmail(email) {
    const pattern = ${VALIDATION_PATTERNS.email.pattern};
    return pattern.test(email);
}`,
    passwordValidation: `
// Example password validation:
function validatePassword(password) {
    const pattern = ${VALIDATION_PATTERNS.password.pattern};
    return pattern.test(password);
}`
};

// Enhanced error display with developer tools
function showError(message, focusElement, type = 'email') {
    let errorContainer = document.createElement('div');
    errorContainer.className = 'dev-error-container';
    
    // Main error message
    let errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    
    // Developer hints
    if (DEV_CONFIG.showHints) {
        let hintsDiv = document.createElement('div');
        hintsDiv.className = 'dev-hints';
        DEV_HINTS[type].forEach(hint => {
            let hintElement = document.createElement('p');
            hintElement.textContent = `💡 ${hint}`;
            hintsDiv.appendChild(hintElement);
        });
        errorContainer.appendChild(hintsDiv);
    }
    
    // Code example
    if (DEV_CONFIG.debugMode) {
        let codeExample = document.createElement('pre');
        codeExample.className = 'code-example';
        codeExample.textContent = type === 'email' ? 
            CODE_EXAMPLES.emailValidation : 
            CODE_EXAMPLES.passwordValidation;
        errorContainer.appendChild(codeExample);
    }
    
    // Styling
    Object.assign(errorContainer.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '400px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        zIndex: '10000'
    });

    document.body.appendChild(errorContainer);

    // Auto-remove after delay
    setTimeout(() => errorContainer.remove(), 8000);

    // Focus handling
    if (focusElement) {
        focusElement.focus();
    }

    // Log error occurrence
    console.group('🚨 Validation Error');
    console.log('Type:', type);
    console.log('Message:', message);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
}

// Enhanced Stack Overflow integration with specific tags
function redirectToStackOverflow(errorType, fileName) {
    const tags = ['javascript', 'form-validation', 'regex'];
    const searchQuery = encodeURIComponent(`[${tags.join('] [')}] ${errorType} in ${fileName}`);
    const stackOverflowURL = `https://stackoverflow.com/search?q=${searchQuery}`;
    
    // Open in new tab
    window.open(stackOverflowURL, '_blank');
    
    // Log for debugging
    if (DEV_CONFIG.debugMode) {
        console.log('Stack Overflow Search:', {
            error: errorType,
            file: fileName,
            tags: tags,
            url: stackOverflowURL
        });
    }
}

// Developer console logging
function devLog(type, message, data = {}) {
    if (DEV_CONFIG.debugMode) {
        console.group(`🛠️ Dev Tools - ${type}`);
        console.log('Message:', message);
        console.log('Data:', data);
        console.groupEnd();
    }
}

// Form submission handler with developer tools
document.addEventListener('submit', (event) => {
    const form = event.target;
    const emailField = form.querySelector('input[type="text"], input[type="email"], input[name="email"]');
    const passwordField = form.querySelector('input[type="password"]');

    if (emailField && passwordField) {
        const email = emailField.value;
        const password = passwordField.value;

        let hasError = false;

        // Email validation
        if (!VALIDATION_PATTERNS.email.pattern.test(email)) {
            event.preventDefault();
            hasError = true;
            showError(
                'Please enter a valid email address',
                emailField,
                'email'
            );
            devLog('Validation Error', 'Email validation failed', { email });
        }

        // Password validation
        if (!VALIDATION_PATTERNS.password.pattern.test(password)) {
            event.preventDefault();
            hasError = true;
            showError(
                'Password must be at least 8 characters long',
                passwordField,
                'password'
            );
            devLog('Validation Error', 'Password validation failed', {
                passwordLength: password.length
            });
        }

        // If validation passes
        if (!hasError) {
            // Log successful validation
            devLog('Validation Success', 'Form validation passed', {
                email: email,
                passwordLength: password.length
            });
            
            // Allow form submission
            return true;
        }
    }
});

// Add this at the beginning of your file
const EXTENSION_VERSION = '1.0.0';

// Extension initialization verification
console.group(`🚀 Extension Loaded - v${EXTENSION_VERSION}`);
console.log('Debug Mode:', DEV_CONFIG.debugMode);
console.log('Features Enabled:', {
    hints: DEV_CONFIG.showHints,
    autoComplete: DEV_CONFIG.autoComplete,
    validationDelay: DEV_CONFIG.validationDelay
});
console.groupEnd();

// Add a visual indicator
function showExtensionStatus() {
    const statusBadge = document.createElement('div');
    statusBadge.id = 'extension-status';
    statusBadge.innerHTML = `
        <div style="
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 128, 0, 0.9);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
        ">
            <span style="color: #00ff00;">●</span>
            Form Validator Active v${EXTENSION_VERSION}
        </div>
    `;

    // Add click handler to show features
    statusBadge.onclick = showFeaturesList;
    document.body.appendChild(statusBadge);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusBadge.style.opacity = '0.3';
    }, 5000);

    // Show on hover
    statusBadge.addEventListener('mouseenter', () => {
        statusBadge.style.opacity = '1';
    });

    statusBadge.addEventListener('mouseleave', () => {
        statusBadge.style.opacity = '0.3';
    });
}

// Feature list display
function showFeaturesList() {
    const featuresList = document.createElement('div');
    featuresList.innerHTML = `
        <div style="
            position: fixed;
            top: 50px;
            right: 10px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10001;
            max-width: 300px;
        ">
            <h3 style="margin: 0 0 10px 0; color: #333;">Active Features</h3>
            <ul style="margin: 0; padding: 0 0 0 20px;">
                <li>Debug Mode: ${DEV_CONFIG.debugMode ? '✅' : '❌'}</li>
                <li>Show Hints: ${DEV_CONFIG.showHints ? '✅' : '❌'}</li>
                <li>Auto Complete: ${DEV_CONFIG.autoComplete ? '✅' : '❌'}</li>
                <li>Validation Delay: ${DEV_CONFIG.validationDelay}ms</li>
                <li>Max Attempts: ${DEV_CONFIG.maxAttempts}</li>
            </ul>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                Click anywhere to close
            </div>
        </div>
    `;

    // Close on click
    featuresList.onclick = () => featuresList.remove();
    document.body.appendChild(featuresList);
}

// Add test function
function testValidation() {
    console.group('🧪 Testing Validation');
    
    // Test email validation
    const testEmails = [
        'test@gmail.com',
        'invalid-email',
        'test@.com',
        'test@domain.'
    ];

    console.log('Testing Email Validation:');
    testEmails.forEach(email => {
        const isValid = VALIDATION_PATTERNS.email.pattern.test(email);
        console.log(`${email}: ${isValid ? '✅' : '❌'}`);
    });

    // Test password validation
    const testPasswords = [
        'Password123',
        'password',
        'PASSWORD123',
        'Pass1'
    ];

    console.log('\nTesting Password Validation:');
    testPasswords.forEach(password => {
        const isValid = VALIDATION_PATTERNS.password.pattern.test(password);
        console.log(`${password}: ${isValid ? '✅' : '❌'}`);
    });

    console.groupEnd();
}

// Initialize verification features
document.addEventListener('DOMContentLoaded', () => {
    showExtensionStatus();
    testValidation();

    // Log active event listeners
    console.log('🎯 Active Event Listeners:', {
        'form-submit': 'Validation handler active',
        'input-fields': 'Real-time validation active',
        'error-display': 'Error handling active'
    });
});

// Add this debugging helper
function debugFormFields() {
    const forms = document.querySelectorAll('form');
    console.group('🔍 Form Fields Debug');
    forms.forEach((form, index) => {
        console.log(`Form #${index + 1}:`);
        console.log('Email field:', form.querySelector('input[type="text"], input[type="email"], input[name="email"]'));
        console.log('Password field:', form.querySelector('input[type="password"]'));
    });
    console.groupEnd();
}

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
    debugFormFields();
    // ... rest of your initialization code ...
});
