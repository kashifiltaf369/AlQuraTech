// Resume Builder State
let currentTemplate = 'modern';
let resumeData = {
    personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: ''
    },
    summary: '',
    skills: [],
    experience: [],
    education: []
};

// Template Styles
const templates = {
    modern: {
        header: 'text-4xl font-bold text-gray-800 mb-4',
        section: 'text-2xl font-semibold text-gray-700 mb-3',
        text: 'text-gray-600',
        accent: '#4f46e5'
    },
    classic: {
        header: 'text-3xl font-bold text-gray-900 mb-4',
        section: 'text-xl font-semibold text-gray-800 mb-3',
        text: 'text-gray-700',
        accent: '#1a365d'
    },
    minimal: {
        header: 'text-3xl font-light text-gray-800 mb-4',
        section: 'text-lg font-medium text-gray-700 mb-3',
        text: 'text-gray-600',
        accent: '#4a5568'
    }
};

// Initialize the resume builder
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data if available
    const savedData = localStorage.getItem('resumeData');
    if (savedData) {
        resumeData = JSON.parse(savedData);
        updateForm();
    }

    // Set up event listeners
    setupEventListeners();
    
    // Initial preview update
    updatePreview();
});

// Set up event listeners
function setupEventListeners() {
    // Personal information
    document.getElementById('fullName').addEventListener('input', updateResumeData);
    document.getElementById('email').addEventListener('input', updateResumeData);
    document.getElementById('phone').addEventListener('input', updateResumeData);
    document.getElementById('location').addEventListener('input', updateResumeData);
    
    // Summary
    document.getElementById('summary').addEventListener('input', updateResumeData);
    
    // Skills
    document.getElementById('skillInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    });
}

// Update resume data
function updateResumeData(e) {
    const field = e.target.id;
    if (field in resumeData.personalInfo) {
        resumeData.personalInfo[field] = e.target.value;
    } else {
        resumeData[field] = e.target.value;
    }
    saveResumeData();
    updatePreview();
}

// Add a skill
function addSkill() {
    const input = document.getElementById('skillInput');
    const skill = input.value.trim();
    
    if (skill && !resumeData.skills.includes(skill)) {
        resumeData.skills.push(skill);
        saveResumeData();
        updatePreview();
        input.value = '';
    }
}

// Remove a skill
function removeSkill(skill) {
    resumeData.skills = resumeData.skills.filter(s => s !== skill);
    saveResumeData();
    updatePreview();
}

// Add experience
function addExperience() {
    const experience = {
        id: Date.now(),
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: ''
    };
    
    resumeData.experience.push(experience);
    saveResumeData();
    updatePreview();
}

// Update experience
function updateExperience(id, field, value) {
    const experience = resumeData.experience.find(e => e.id === id);
    if (experience) {
        experience[field] = value;
        saveResumeData();
        updatePreview();
    }
}

// Remove experience
function removeExperience(id) {
    resumeData.experience = resumeData.experience.filter(e => e.id !== id);
    saveResumeData();
    updatePreview();
}

// Add education
function addEducation() {
    const education = {
        id: Date.now(),
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        description: ''
    };
    
    resumeData.education.push(education);
    saveResumeData();
    updatePreview();
}

// Update education
function updateEducation(id, field, value) {
    const education = resumeData.education.find(e => e.id === id);
    if (education) {
        education[field] = value;
        saveResumeData();
        updatePreview();
    }
}

// Remove education
function removeEducation(id) {
    resumeData.education = resumeData.education.filter(e => e.id !== id);
    saveResumeData();
    updatePreview();
}

// Change template
function changeTemplate(template) {
    currentTemplate = template;
    updatePreview();
}

// Update preview
function updatePreview() {
    const preview = document.getElementById('resumePreview');
    const style = templates[currentTemplate];
    
    preview.innerHTML = `
        <div class="max-w-3xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="${style.header}">${resumeData.personalInfo.fullName || 'Your Name'}</h1>
                <div class="flex justify-center space-x-4 text-sm ${style.text}">
                    ${resumeData.personalInfo.email ? `<span>${resumeData.personalInfo.email}</span>` : ''}
                    ${resumeData.personalInfo.phone ? `<span>${resumeData.personalInfo.phone}</span>` : ''}
                    ${resumeData.personalInfo.location ? `<span>${resumeData.personalInfo.location}</span>` : ''}
                </div>
            </div>
            
            <!-- Summary -->
            ${resumeData.summary ? `
                <div class="mb-8">
                    <h2 class="${style.section}">Professional Summary</h2>
                    <p class="${style.text}">${resumeData.summary}</p>
                </div>
            ` : ''}
            
            <!-- Skills -->
            ${resumeData.skills.length > 0 ? `
                <div class="mb-8">
                    <h2 class="${style.section}">Skills</h2>
                    <div class="flex flex-wrap gap-2">
                        ${resumeData.skills.map(skill => `
                            <span class="px-3 py-1 bg-gray-100 rounded-full text-sm ${style.text}">${skill}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Experience -->
            ${resumeData.experience.length > 0 ? `
                <div class="mb-8">
                    <h2 class="${style.section}">Experience</h2>
                    ${resumeData.experience.map(exp => `
                        <div class="mb-4">
                            <h3 class="font-semibold ${style.text}">${exp.position || 'Position'}</h3>
                            <p class="text-sm ${style.text}">${exp.company || 'Company'} | ${exp.startDate || 'Start'} - ${exp.endDate || 'Present'}</p>
                            ${exp.description ? `<p class="mt-2 ${style.text}">${exp.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Education -->
            ${resumeData.education.length > 0 ? `
                <div class="mb-8">
                    <h2 class="${style.section}">Education</h2>
                    ${resumeData.education.map(edu => `
                        <div class="mb-4">
                            <h3 class="font-semibold ${style.text}">${edu.degree || 'Degree'}</h3>
                            <p class="text-sm ${style.text}">${edu.institution || 'Institution'} | ${edu.startDate || 'Start'} - ${edu.endDate || 'Present'}</p>
                            ${edu.description ? `<p class="mt-2 ${style.text}">${edu.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Save resume data to localStorage
function saveResumeData() {
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
}

// Export resume
function exportResume() {
    const element = document.getElementById('resumePreview');
    const opt = {
        margin: 1,
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().set(opt).from(element).save();
}

// AI Assistant Functions
function generateAISummary() {
    const skills = resumeData.skills.join(', ');
    const experience = resumeData.experience.map(exp => exp.position).join(', ');
    
    // Simulate AI response
    const summary = `Experienced professional with expertise in ${skills}. Proven track record in ${experience}. Strong problem-solving abilities and excellent communication skills.`;
    
    document.getElementById('summary').value = summary;
    updateResumeData({ target: { id: 'summary', value: summary } });
}

function generateAISkills() {
    const commonSkills = [
        'JavaScript', 'Python', 'React', 'Node.js', 'SQL',
        'Git', 'Docker', 'AWS', 'Agile', 'Problem Solving',
        'Team Leadership', 'Project Management', 'Communication'
    ];
    
    // Add 5 random skills that aren't already in the list
    const newSkills = commonSkills
        .filter(skill => !resumeData.skills.includes(skill))
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
    
    resumeData.skills.push(...newSkills);
    saveResumeData();
    updatePreview();
}

function suggestExperience() {
    const suggestions = [
        'Add quantifiable achievements to your experience descriptions',
        'Include relevant certifications and training',
        'Highlight leadership and team collaboration experiences',
        'Mention specific technologies and tools used in each role'
    ];
    
    addAISuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
}

function addAISuggestion(suggestion) {
    const container = document.getElementById('aiSuggestions');
    const element = document.createElement('div');
    element.className = 'ai-suggestion bg-gray-700 p-4 rounded-lg';
    element.innerHTML = `
        <div class="flex items-start space-x-2">
            <i class="fas fa-lightbulb text-yellow-400 mt-1"></i>
            <p>${suggestion}</p>
        </div>
    `;
    container.insertBefore(element, container.firstChild);
}

// Chat Interface
function toggleChat() {
    const chat = document.querySelector('.fixed.bottom-4.right-4');
    chat.classList.toggle('minimized');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        addChatMessage('user', message);
        input.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const responses = [
                'I can help you improve your resume. What specific aspect would you like to focus on?',
                'Consider adding more details about your achievements in your experience section.',
                'Your skills section could benefit from more specific technical skills.',
                'Would you like me to help you write a compelling professional summary?'
            ];
            addChatMessage('ai', responses[Math.floor(Math.random() * responses.length)]);
        }, 1000);
    }
}

function addChatMessage(type, message) {
    const container = document.getElementById('chatMessages');
    const element = document.createElement('div');
    element.className = `message ${type}`;
    element.innerHTML = `
        <div class="flex items-start space-x-2">
            ${type === 'ai' ? '<i class="fas fa-robot text-indigo-500 mt-1"></i>' : ''}
            <p>${message}</p>
        </div>
    `;
    container.appendChild(element);
    container.scrollTop = container.scrollHeight;
}

// Update form with saved data
function updateForm() {
    // Personal information
    document.getElementById('fullName').value = resumeData.personalInfo.fullName;
    document.getElementById('email').value = resumeData.personalInfo.email;
    document.getElementById('phone').value = resumeData.personalInfo.phone;
    document.getElementById('location').value = resumeData.personalInfo.location;
    
    // Summary
    document.getElementById('summary').value = resumeData.summary;
    
    // Skills
    const skillTags = document.getElementById('skillTags');
    skillTags.innerHTML = resumeData.skills.map(skill => `
        <span class="skill-badge">
            ${skill}
            <button onclick="removeSkill('${skill}')" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
} 