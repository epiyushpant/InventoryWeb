const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('c:\\Projects\\web\\Inventory\\app\\(auth)', function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already processed
    if (content.includes('useFormValidation')) return;
    if (!content.includes('<form onSubmit={')) return;

    // 1. Add imports
    const importMatch = content.match(/import .*?;/g);
    if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        const newImports = lastImport + "\nimport { useFormValidation } from '@/hooks/useFormValidation';\nimport FormErrors from '@/components/FormErrors';";
        content = content.replace(lastImport, newImports);
    }

    // 2. Add hook in component
    // Look for a common useState or useEffect to inject hook before it
    if (content.includes('const [showModal, setShowModal] = useState(false);')) {
        content = content.replace(
            /const \[showModal, setShowModal\] = useState\(false\);/, 
            "const [showModal, setShowModal] = useState(false);\n    const { validationErrors, validateAndSubmit } = useFormValidation();"
        );
    } else {
        // Find const handleSubmit
        content = content.replace(
            /const handleSubmit =/, 
            "const { validationErrors, validateAndSubmit } = useFormValidation();\n\n    const handleSubmit ="
        );
    }

    // 3. Update form tag
    content = content.replace(
        /<form onSubmit=\{handleSubmit\}>/g,
        "<form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>"
    );
    // If it was already using e => handleSubmit(e) or something, we can use a more generic regex
    content = content.replace(
        /<form onSubmit=\{\(e\) => handleSubmit\(e\)\}>/g,
        "<form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>"
    );

    // 4. Add FormErrors
    // Before className="form-actions" or before </form> if form-actions is not found
    if (content.includes('<div className="form-actions">')) {
        content = content.replace(
            /<div className="form-actions">/g,
            `<FormErrors errors={validationErrors} />\n                            <div className="form-actions">`
        );
    } else {
        content = content.replace(
            /<\/form>/g,
            `    <FormErrors errors={validationErrors} />\n                        </form>`
        );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
});
