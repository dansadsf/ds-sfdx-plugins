import { core, flags, SfdxCommand } from '@salesforce/command';
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
const messages = Messages.loadMessages('permSetStuffer', 'add');

export default class Add extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx permSetStuff:add --permissionset Permission_Set_Devname,Other_Permission_Set 
  `,
  `$ sfdx permSetStuff:add --permissionset Permission_Set_Devname,Other_Permission_Set --justbranch
  `
  ];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    permissionset: flags.array({char: 'p', description: messages.getMessage('permissionSetDescription'), required: true, }),
    justbranch: flags.boolean({char: 'j', description: messages.getMessage('justBranchDescription')}),
    permsetpath: flags.string({char: 'f', description: messages.getMessage('permsetpathDescription'), default: 'force-app/main/default/permissionsets'}),
    objectpath: flags.string({char: 'o', description: messages.getMessage('objectPathDescription'), default: 'force-app/main/default/objects'}),
    noprompt: flags.boolean({char: 'n', description: messages.getMessage('nopromptDescription'), default:false})
  };

  // Comment this out if your command does not require an org username
  // protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  // protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    
    let filePaths = this.listFiles();
    if (!filePaths.length ) {
      this.ux.log('No files found with the options specified');
      return {filePaths};
    }
    
    let permissionSets = this.flags.permissionset;
    for (let permSetName of permissionSets) {
      let json = await this.getJsonFromXML(permSetName);
      let fileNames = filePaths.map(filepath => {
        const {objectName, fieldName}:IMetadata = this._getObjectAndField(filepath);
        return `${objectName}.${fieldName}`;
      });
      const missing = fileNames.filter(fileName => !this.hasField(json, fileName));
      if (missing.length) {
        let proceed = true;
        if (!this.flags.noprompt) {
          const confirmMessage = `These fields:\n
          ${missing.map(field=> `${field}, \n`)}
          will be added to this permission set: ${permSetName}, both read and write.
          Ok? (y/n)`;
          let confirm = await this.ux.prompt(confirmMessage);
          if (!['y','yes'].includes(confirm.toLowerCase())) {
            proceed = false;
          }
        }
        
        if (proceed) {
          missing.forEach(fieldName => {
            json = this.addField(json, fieldName);
          });
          this.writeToFile(json,permSetName);
          this.ux.log(`Wrote ${missing.length} field${missing.length > 1 ? 's': ''} to ${permSetName}`);
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
  
  private listFiles(): Array<string> {
    const objectPath = this.flags.objectpath;
    if (this.flags.justbranch) {
      return this._listFilesUsingGit(objectPath);
    }
    return glob.sync(`${objectPath}/**/*.field-meta.xml`);

  }
  
  private _listFilesUsingGit(objectPath:string): Array<string> {
    let branchName = this._getBranchName();
    if(!branchName || branchName === 'master' || branchName === 'main'){
      throw new core.SfdxError(
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
  
  private _getObjectAndField(pathString:string): IMetadata {
    //Given `path/to/Object__c/Field__c.field-meta.xml`, 
    // return {objectName: 'Object__c', fieldName: 'Field__c'}
    const arr = pathString.split('/');
    const l = arr.length;
    const objectName = arr[l-3];
    let fieldName = arr[l-1];
    let dotIndex = fieldName.indexOf('.');
    fieldName = fieldName.substring(0,dotIndex);
    const rt:IMetadata = {
      objectName,
      fieldName
    };
    return rt;
  }
    
  private async getJsonFromXML (permissionSetName:string): Promise<AnyJson> {
    const permissionSetPath = this.getPermissionSetPath(permissionSetName);
    const permSetString = fs.readFileSync(permissionSetPath, {encoding: 'utf-8'});
    return await xml2js.parseStringPromise(permSetString);
  }
  
  private writeToFile(json:AnyJson, apiName:string): void {
    let name = this.getPermissionSetPath(apiName);
    
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
    
    
    fs.writeFileSync(name, xml);
  }
  
  private hasField (permSet:any, fieldName:string): boolean {
    const fieldPermissions = permSet.PermissionSet.fieldPermissions;
    return fieldPermissions.some(permission =>  permission.field.includes(fieldName) );
  }
  
  private addField (permSet:any, fieldName:string): AnyJson {
    permSet.PermissionSet.fieldPermissions.push({
      editable: ['true'],
      field: [fieldName],
      readable: ['true']
    });
    return permSet;
  }
}

interface IMetadata {
  objectName: string,
  fieldName: string,
}