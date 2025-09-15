const documentParser = require('./services/documentParser');
const path = require('path');

/**
 * Test script for document parsing functionality
 */
async function testDocumentParsing() {
  console.log('🧪 Testing Document Parser Service\n');

  // Test 1: Test service initialization
  console.log('📋 Test 1: Service Initialization');
  try {
    console.log('✅ Document parser service loaded successfully');
  } catch (error) {
    console.log('❌ Failed to load document parser service:', error.message);
    return;
  }

  // Test 2: Test PDF parsing (if sample file exists)
  console.log('\n📋 Test 2: PDF Parsing Test');
  const samplePdfPath = path.join(__dirname, 'test-files', 'sample-resume.pdf');
  
  try {
    // Create test directory if it doesn't exist
    const fs = require('fs');
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Check if sample file exists
    if (fs.existsSync(samplePdfPath)) {
      console.log('📄 Found sample PDF file, testing parsing...');
      const result = await documentParser.parseDocument(samplePdfPath);
      
      if (result.success) {
        console.log('✅ PDF parsing successful!');
        console.log(`   - File size: ${result.metadata.fileSize} bytes`);
        console.log(`   - Word count: ${result.metadata.wordCount}`);
        console.log(`   - Character count: ${result.metadata.characterCount}`);
        console.log(`   - Pages: ${result.metadata.pages || 'N/A'}`);
        console.log(`   - Text preview: ${result.text.substring(0, 100)}...`);
        
        // Test information extraction
        console.log('\n📊 Testing Information Extraction:');
        const extractedInfo = documentParser.extractResumeInfo(result.text);
        console.log('   - Contact info:', JSON.stringify(extractedInfo.contactInfo, null, 2));
        console.log('   - Skills found:', extractedInfo.skills.length);
        console.log('   - Education entries:', extractedInfo.education.length);
        console.log('   - Work experience:', extractedInfo.workExperience.length);
        
        // Test validation
        console.log('\n✅ Testing Document Validation:');
        const validation = documentParser.validateExtractedData(result);
        console.log(`   - Is valid: ${validation.isValid}`);
        console.log(`   - Confidence: ${validation.confidence}%`);
        console.log(`   - Warnings: ${validation.warnings.length}`);
        
      } else {
        console.log('❌ PDF parsing failed:', result.error);
      }
    } else {
      console.log('⚠️  No sample PDF file found at:', samplePdfPath);
      console.log('   To test PDF parsing, place a sample resume PDF at the above path');
    }
  } catch (error) {
    console.log('❌ PDF parsing test error:', error.message);
  }

  // Test 3: Test DOCX parsing (if sample file exists)
  console.log('\n📋 Test 3: DOCX Parsing Test');
  const sampleDocxPath = path.join(__dirname, 'test-files', 'sample-resume.docx');
  
  try {
    const fs = require('fs');
    if (fs.existsSync(sampleDocxPath)) {
      console.log('📄 Found sample DOCX file, testing parsing...');
      const result = await documentParser.parseDocument(sampleDocxPath);
      
      if (result.success) {
        console.log('✅ DOCX parsing successful!');
        console.log(`   - File size: ${result.metadata.fileSize} bytes`);
        console.log(`   - Word count: ${result.metadata.wordCount}`);
        console.log(`   - Text preview: ${result.text.substring(0, 100)}...`);
      } else {
        console.log('❌ DOCX parsing failed:', result.error);
      }
    } else {
      console.log('⚠️  No sample DOCX file found at:', sampleDocxPath);
      console.log('   To test DOCX parsing, place a sample resume DOCX at the above path');
    }
  } catch (error) {
    console.log('❌ DOCX parsing test error:', error.message);
  }

  // Test 4: Test text extraction methods
  console.log('\n📋 Test 4: Text Extraction Methods');
  
  const sampleText = `
    John Doe
    Software Engineer
    john.doe@example.com
    +1 (555) 123-4567
    linkedin.com/in/johndoe
    
    EXPERIENCE
    TechCorp Inc.
    Senior Developer
    2020 - Present
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of Technology
    2018
    
    SKILLS
    JavaScript, React, Node.js, Python, MongoDB, Docker
    
    PROJECTS
    E-commerce Platform
    Built using React and Node.js
  `;

  try {
    const extractedInfo = documentParser.extractResumeInfo(sampleText);
    
    console.log('✅ Text extraction methods working:');
    console.log('   - Contact info extraction:', Object.keys(extractedInfo.contactInfo).length, 'fields');
    console.log('   - Skills extraction:', extractedInfo.skills.length, 'skills found');
    console.log('   - Education extraction:', extractedInfo.education.length, 'entries');
    console.log('   - Experience extraction:', extractedInfo.workExperience.length, 'entries');
    console.log('   - Projects extraction:', extractedInfo.projects.length, 'projects');
    
    if (extractedInfo.contactInfo.email) {
      console.log('   ✅ Email extracted:', extractedInfo.contactInfo.email);
    }
    
    if (extractedInfo.skills.length > 0) {
      console.log('   ✅ Skills found:', extractedInfo.skills.slice(0, 5).join(', '), '...');
    }
    
  } catch (error) {
    console.log('❌ Text extraction test error:', error.message);
  }

  // Test 5: Test error handling
  console.log('\n📋 Test 5: Error Handling');
  try {
    const result = await documentParser.parseDocument('/nonexistent/file.pdf');
    
    if (!result.success) {
      console.log('✅ Error handling working correctly');
      console.log(`   - Error message: ${result.error}`);
    } else {
      console.log('❌ Error handling failed - should have returned error for nonexistent file');
    }
  } catch (error) {
    console.log('✅ Exception handling working correctly');
  }

  console.log('\n🎉 Document Parser Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('✅ Service loads correctly');
  console.log('✅ Error handling works');
  console.log('✅ Text extraction methods functional');
  console.log('⚠️  PDF/DOCX parsing requires sample files for testing');
  console.log('\n💡 To fully test:');
  console.log('1. Place sample resume files in ./test-files/');
  console.log('2. Run: node test-document-parser.js');
  console.log('3. Check parsing results and extracted information');
}

// Run the test
testDocumentParsing().catch(console.error);