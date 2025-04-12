const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Resume templates
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

// Base HTML template
const baseTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Resume</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            .no-print {
                display: none;
            }
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body class="bg-white text-gray-900">
    <div class="max-w-4xl mx-auto p-8">
        {{content}}
    </div>
</body>
</html>
`;

// Generate resume HTML
function generateResumeHTML(data, template = 'modern') {
    const style = templates[template];
    
    return `
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="${style.header}">${data.personalInfo.fullName || 'Your Name'}</h1>
            <div class="flex justify-center space-x-4 text-sm ${style.text}">
                ${data.personalInfo.email ? `<span>${data.personalInfo.email}</span>` : ''}
                ${data.personalInfo.phone ? `<span>${data.personalInfo.phone}</span>` : ''}
                ${data.personalInfo.location ? `<span>${data.personalInfo.location}</span>` : ''}
            </div>
        </div>
        
        <!-- Summary -->
        ${data.summary ? `
            <div class="mb-8">
                <h2 class="${style.section}">Professional Summary</h2>
                <p class="${style.text}">${data.summary}</p>
            </div>
        ` : ''}
        
        <!-- Skills -->
        ${data.skills.length > 0 ? `
            <div class="mb-8">
                <h2 class="${style.section}">Skills</h2>
                <div class="flex flex-wrap gap-2">
                    ${data.skills.map(skill => `
                        <span class="px-3 py-1 bg-gray-100 rounded-full text-sm ${style.text}">${skill}</span>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <!-- Experience -->
        ${data.experience.length > 0 ? `
            <div class="mb-8">
                <h2 class="${style.section}">Experience</h2>
                ${data.experience.map(exp => `
                    <div class="mb-4">
                        <h3 class="font-semibold ${style.text}">${exp.position || 'Position'}</h3>
                        <p class="text-sm ${style.text}">${exp.company || 'Company'} | ${exp.startDate || 'Start'} - ${exp.endDate || 'Present'}</p>
                        ${exp.description ? `<p class="mt-2 ${style.text}">${exp.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <!-- Education -->
        ${data.education.length > 0 ? `
            <div class="mb-8">
                <h2 class="${style.section}">Education</h2>
                ${data.education.map(edu => `
                    <div class="mb-4">
                        <h3 class="font-semibold ${style.text}">${edu.degree || 'Degree'}</h3>
                        <p class="text-sm ${style.text}">${edu.institution || 'Institution'} | ${edu.startDate || 'Start'} - ${edu.endDate || 'Present'}</p>
                        ${edu.description ? `<p class="mt-2 ${style.text}">${edu.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

// Generate static resumes
async function generateResumes() {
    // Create output directory
    const outputDir = path.join(__dirname, '../_site/resumes');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read resume data
    const resumeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../resume/resume_data.json'), 'utf8'));

    // Generate resumes for each template
    for (const template of Object.keys(templates)) {
        const html = baseTemplate
            .replace('{{name}}', resumeData.personalInfo.fullName || 'Resume')
            .replace('{{content}}', generateResumeHTML(resumeData, template));

        // Write HTML file
        const filename = `resume-${template}.html`;
        fs.writeFileSync(path.join(outputDir, filename), html);

        // Generate PDF using Puppeteer
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Add print-specific styles
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `;
        document.head.appendChild(style);

        // Write the modified HTML
        fs.writeFileSync(path.join(outputDir, `print-${filename}`), dom.serialize());
    }
}

// Run the generator
generateResumes().catch(console.error); 