// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 23, 42, 0.98)';
    } else {
        navbar.style.background = 'rgba(15, 23, 42, 0.95)';
    }
});

// Contact form handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('.btn-primary');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        const formData = {
            email: document.getElementById('email').value,
            question: document.getElementById('question').value
        };
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage('Thank you! Your question has been sent successfully.', 'success');
                this.reset();
            } else {
                showMessage(result.error || 'Failed to send question. Please try again.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Rules form handling
const rulesForm = document.getElementById('rulesForm');
if (rulesForm) {
    const guestCountInput = document.getElementById('guestCount');
    const guestsContainer = document.getElementById('guestsContainer');
    
    // Create dynamic guest fields
    function createGuestFields(count) {
        guestsContainer.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const guestDiv = document.createElement('div');
            guestDiv.className = 'guest-fields';
            guestDiv.innerHTML = `
                <h4>Guest ${i + 1}</h4>
                <div class="guest-row">
                    <div class="form-group">
                        <label for="guestName_${i}">Name:</label>
                        <input type="text" id="guestName_${i}" name="guestName_${i}" required>
                    </div>
                    <div class="form-group">
                        <label for="guestAge_${i}">Approximate Age:</label>
                        <input type="number" id="guestAge_${i}" name="guestAge_${i}" min="1" max="120" required>
                    </div>
                    <button type="button" class="remove-guest-btn" onclick="removeGuest(this)">Remove</button>
                </div>
            `;
            guestsContainer.appendChild(guestDiv);
        }
    }
    
    // Update guest fields when count changes
    guestCountInput.addEventListener('change', function() {
        const count = parseInt(this.value) || 0;
        createGuestFields(count);
    });
    
    // Remove guest function
    window.removeGuest = function(button) {
        const guestDiv = button.closest('.guest-fields');
        guestDiv.remove();
        
        // Update the count input
        const currentCount = guestsContainer.children.length;
        guestCountInput.value = currentCount;
        
        // Recreate fields with updated numbering
        createGuestFields(currentCount);
    };
    
    // Form submission
    rulesForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('.btn-primary');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // Collect guest information
        const guests = [];
        const guestFields = guestsContainer.querySelectorAll('.guest-fields');
        
        guestFields.forEach((field, index) => {
            const name = field.querySelector(`#guestName_${index}`).value.trim();
            const age = parseInt(field.querySelector(`#guestAge_${index}`).value);
            
            if (name && age) {
                guests.push({ name, age });
            }
        });
        
        const formData = {
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            guests: guests,
            message: document.getElementById('reason').value
        };
        
        try {
            const response = await fetch('/api/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage('Thank you! Your questionnaire has been submitted successfully. We will respond within 48 hours.', 'success');
                this.reset();
                guestsContainer.innerHTML = '';
            } else {
                showMessage(result.error || 'Failed to submit questionnaire. Please try again.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Show message function
function showMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'form-message';
            }, 5000);
        }
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.amenity-item, .beach-item, .activity-item, .restaurant-item, .rule-section, .section-image, .section-images');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});