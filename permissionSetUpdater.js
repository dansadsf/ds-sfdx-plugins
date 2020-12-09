/*
Add all your new fields to your permission set.

Usage:

$> node permissionsetUpdater.js EI_Admin,EI_Standard,...


*/


const fs = require('fs');
const xml2js = require('xml2js');
const {execSync} = require('child_process');

const args = process.argv.slice(2);
const permSetDirectory = 'force-app/main/default/permissionsets'
const renderOpts = { 'pretty': true, 'indent': '    '};
const builder = new xml2js.Builder({renderOpts});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const getPermissionSetPath = (name) => {
  return `${permSetDirectory}/${name}.permissionset-meta.xml`;
}

let listFiles = () => {
  //Lists the fields that are different between this branch and master. 
  let branchName = _getBranchName();
  if(!branchName || branch === 'master'){
    console.error(`Checkout a branch (other than master)`);
    return;
  }
  
  let newFilesString = execSync(`git diff --name-only ${branchName}..origin/master`, {encoding: 'utf-8'}).toString().trim();
  let newFileArray = newFilesString.split('\n');
  newFileArray = newFileArray.filter(file => file.startsWith('force-app/main/default/objects'));
  return newFileArray
}

const _getBranchName = () => {
  //Get currently checked out branch
  let branchString = execSync('git branch', { encoding: 'utf-8' }).toString().trim();
  let branchArray = branchString.split('\n');
  let branchName = branchArray.find(branch => branch.startsWith('*'));
  if(branchName) {
    branchName = branchName.replace('* ', '');
    return branchName;
  }
}

let parseFilePaths = (filePathArray) =>{
  // Given an array of file paths, return an object like this:
  /*{
    ObjectName__c: ['Field__c','OtherField__c'...],
    OtherObject__c: ...
  }
  */
 let obj = {};
 filePathArray.forEach(pathString => {
   let {objectName, fieldName} = _getObjectAndField(pathString);
   if (!obj[objectName]) {
     obj[objectName] = [];
   }
   obj[objectName].push(fieldName);
  });
  return obj;
}

const _getObjectAndField = (pathString) => {
  //Given `path/to/Object__c/Field__c.field-meta.xml`, 
  // return {objectName: 'Object__c', fieldName: 'Field__c'}
  const arr = pathString.split('/');
  const objectName = arr[4];
  let fieldName = arr[6];
  let dotIndex = fieldName.indexOf('.');
  fieldName = fieldName.substring(0,dotIndex);
  return {
    objectName,
    fieldName
  }
}

const getJsonFromXML = async (permissionSetName) =>{
  const permissionSetPath = `${permSetDirectory}${permissionSetName}`;
  const permSetString = fs.readFileSync(permissionSetPath, {encoding: 'utf-8'});
  return await xml2js.parseStringPromise(permSetString);
}

const writeToFile = async (json, apiName) => {
  let name = getPermissionSetPath(apiName);
  let xml = builder.buildObject(json);
  fs.writeFileSync(name, xml);
  
}

const hasField = (permSet, fieldName) => {
  //fieldName includes object: `Object.Field__c`
  const fieldPermissions = permSet.PermissionSet.fieldPermissions;
  return fieldPermissions.some(permission => { permission.field.includes(fieldName) });
}

const addField = (permSet, fieldName) => {
  permset.PermissionSet.fieldPermissions.push({
    editable: ['true'],
    field: [fieldName],
    readable: ['true']
  });
  return permSet;
}

const main = async () => {
  const permissionSets = args.split(',');
  if ( !permissionSets.length) return;
  
  let filePaths = listFiles();
  if ( !filePaths.length ) return;
  
  permissionSets.forEach(permSetName => {
    let json = await getJsonFromXML(permSetName);
    let fileNames = filePaths.map(filepath => {
      const {objectName, fieldName} = _getObjectAndField(filepath);
      return `{${objectName}.${fieldName}}`;
    });
    const missing = fileNames.filter(fileName => !hasField(json, fileName));
    if (missing.length) {
      
      const message = `\nThese fields:
      ${missing.map(field=> `${field}\n`)}
      will be added to this permission set: ${permSetName}, both read and write.
      Ok? (y/n)
      `
      rl.question(message, (answer) => {
        if (answer && ['y','yes'].includes(answer.toLowerCase())) {
          missing.forEach(fieldName => {
            json = addField(json, fieldName);
          })
          writeToFile(json, permSetName);
          console.log('Ok');
        }
      });
    }
    else {
      console.log(`--> All fields accounted for in ${permSetName} \n`);
    }
  });
}

main();