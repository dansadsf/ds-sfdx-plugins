import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
const {execSync} = require('child_process');
const fs = require('fs');
const xml2js = require('xml2js');
const glob = require("glob")

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('permission-set-stuffer', 'stuff');

export default class Stuff extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx ds:permset:stuff --permissionset Permission_Set_Devname,Other_Permission_Set 
  `,
  `$ sfdx ds:permset:stuff --permissionset Permission_Set_Devname,Other_Permission_Set --addeverything
  `
  ];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    permissionset: flags.array({char: 'p', description: messages.getMessage('permissionSetDescription'), required: true, }),
    addeverything: flags.boolean({char: 'e', description: messages.getMessage('addEverythingDescription'), default: false}),
    permsetpath: flags.string({char: 'f', description: messages.getMessage('permsetpathDescription'), default: 'force-app/main/default/permissionsets'}),
    objectpath: flags.string({char: 'o', description: messages.getMessage('objectPathDescription'), default: 'force-app/main/default/objects'}),
    noprompt: flags.boolean({char: 'n', description: messages.getMessage('nopromptDescription'), default:false}),
    printall: flags.boolean({char:'r', description: 'Print field names', default: false}),
    readpermission: flags.string({char:'d',description: messages.getMessage('readDescription'),default:'true', options: ['true','false']}),
    editpermission: flags.string({char:'t',description: messages.getMessage('editDescription'),default:'true', options: ['true','false']}),
  };

  // Comment this out if your command does not require an org username
  // protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  // protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    //Sanity check
    if (this.flags.readpermission == 'false' && this.flags.editpermission !== 'false') {
      throw new SfdxError(
        messages.getMessage('errorPermissionMismatch')
      );
    }
    
    let filePaths = await this.listFieldPaths();
    if (!filePaths.length ) {
      this.ux.log('No files found with the options specified');
      return {filePaths};
    }
    
    let permissionSets = this.flags.permissionset;
    for (let permSetName of permissionSets) {
      const path = this.getPermissionSetPath(permSetName);
      let json = await this.getJsonFromXML(path);
      
      let fileNames = filePaths.map(filepath => {
        const {objectName, fieldName}:ObjectAndField = this._getObjectAndField(filepath);
        return `${objectName}.${fieldName}`;
      });
      
      const missing = fileNames.filter(fileName => !this.hasField(json, fileName));
      
      if (missing.length) {
        let proceed = true;
        if (!this.flags.noprompt) {
          
          const confirmMessage = this.flags.printall 
                                                  ? messages.getMessage('longFieldConfirm', [missing.join('\n'), permSetName])
                                                  : messages.getMessage('shortFieldConfirm', [missing.length, permSetName]);
          let confirm = await this.ux.prompt(confirmMessage);
          if (!['y','yes'].includes(confirm.toLowerCase())) {
            proceed = false;
          }
        }
        
        if (proceed) {
          missing.forEach(fieldName => {
            json = this.addField(json, fieldName);
          });
          this.writeToFile(json,path);
          this.ux.log(messages.getMessage('summary',[missing.length, permSetName]));
        }

      }
      else {
        this.ux.log(`All fields accounted for in ${permSetName} \n`);
      }
      
    }
    return {filePaths, permissionSets}
  }
  
  private getPermissionSetPath(name:string): string {
    const permSetDirectory = this.flags.permsetpath;
    return `${permSetDirectory}/${name}.permissionset-meta.xml`;
  }
  
  private async listFieldPaths(): Promise<Array<string>> {
    //Return a list of custom field paths to add to the permission set. 
    const objectPath = this.flags.objectpath;
    const fieldList = this.flags.addeverything ? glob.sync(`${objectPath}/**/*.field-meta.xml`) : this._listFilesUsingGit(objectPath);
    const filtered = [];
    //Filter out custom metadata and required fields. 
    for (let fieldPath of fieldList) {
      const fieldJson = await this.getJsonFromXML(fieldPath);
      if (fieldPath.indexOf('__mdt/') === -1 && !this.isRequired(fieldJson)) {
        filtered.push(fieldPath);
      }
    }
    return filtered;
  }
  
  private _listFilesUsingGit(objectPath:string): Array<string> {
    //Return a list of field metadata that are different from master. 
    let branchName = this._getBranchName();
    if(!branchName || branchName === 'master'){
      throw new SfdxError(
        messages.getMessage('errorCheckoutABranch', [branchName])
      );
    }
    
    let newFilesString = execSync(`git diff --name-only ${branchName}..origin/master`, {encoding: 'utf-8'}).toString().trim();
    let newFileArray = newFilesString.split('\n');
    newFileArray = newFileArray.filter(file => file.startsWith(objectPath));
    return newFileArray
  }
  
  private _getBranchName(): string {
    let branchName = '';
    let branchString = execSync('git branch', { encoding: 'utf-8' }).toString().trim();
    let branchArray = branchString.split('\n');
    branchName = branchArray.find(branch => branch.startsWith('*'));
    if(branchName) {
      branchName = branchName.replace('* ', '');
    }
    return branchName;
  }
  
  private _getObjectAndField(pathString:string): ObjectAndField {
    //Given `path/to/Object__c/Field__c.field-meta.xml`, 
    // return {objectName: 'Object__c', fieldName: 'Field__c'}
    const arr = pathString.split('/');
    const l = arr.length;
    const objectName = arr[l-3];
    let fieldName = arr[l-1];
    let dotIndex = fieldName.indexOf('.');
    fieldName = fieldName.substring(0,dotIndex);
    return {
      objectName,
      fieldName
    };
  }
    
  private async getJsonFromXML (path:string): Promise<AnyJson> {
    const xmlString = fs.readFileSync(path, {encoding: 'utf-8'});
    return await xml2js.parseStringPromise(xmlString);
  }
  
  private writeToFile(json:AnyJson, path:string): void {
    
    const renderOpts = { 
      'pretty': true, 
      'indent': '    '
    };
    const xmldec = {
      standalone: null,
      version:"1.0", 
      encoding:"UTF-8"
    }
    
    const builder = new xml2js.Builder({renderOpts, xmldec});
    let xml = builder.buildObject(json);
    
    
    fs.writeFileSync(path, xml);
  }
  
  private hasField (permSet:any, fieldName:string): boolean {
    const fieldPermissions = permSet.PermissionSet.fieldPermissions;
    return fieldPermissions.some(permission =>  permission.field.includes(fieldName) );
  }
  
  private addField (permSet:any, fieldName:string): AnyJson {
    permSet.PermissionSet.fieldPermissions.push({
      editable: [this.flags.editpermission],
      field: [fieldName],
      readable: [this.flags.readpermission]
    });
    return permSet;
  }
  
  private isRequired (fieldJson:any): boolean {
    //If field is required...
    const conditions = {
      required: fieldJson.CustomField.required && fieldJson.CustomField.required[0] == 'true',
      masterDetail: fieldJson.CustomField.type && fieldJson.CustomField.type[0] == 'MasterDetail',
      isName: fieldJson.CustomField.fullName[0] === 'Name',
      isOwner: fieldJson.CustomField.fullName[0] === 'OwnerId'
    };
    return Object.values(conditions).some(check => check);
  }
}

interface ObjectAndField {
  objectName: string,
  fieldName: string,
}