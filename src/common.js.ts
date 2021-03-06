import axios from "axios";
import {OperationOutcome, OperationOutcomeIssue, Patient} from "fhir/r4";
import fs from "fs";
import path from "path";

export const basePath = "/FHIR/R4"

var Fhir = require('fhir').Fhir;

export let defaultBaseUrl = 'http://localhost:9001/FHIR/R4';


export async function validate(resource,contentType ) {

    const response = await axios.post(`${defaultBaseUrl}/$validate`,
        resource,
        {
            headers: {
                'Content-Type': contentType
            }
        });
    return response;
}



export const api = (baseUrl = defaultBaseUrl) => ({
    validate: (resource) => axios.post(`${baseUrl}/$validate`, resource)
        .then(response => response.data)

})

export function getContentType(file) {
    var contentType = 'application/fhir+json';
    var fileExtension = file.split('.').pop();
    if (fileExtension == 'xml' || fileExtension == 'XML') contentType ='application/fhir+xml';
    return contentType;
}

export function resourceChecks(response: any) {

    const resource: any = response.body;
    expect(resource.resourceType).toEqual('OperationOutcome');
    expect(errorsCheck(resource))
}

export function resourceCheckErrorMessage(response: any, message: string) {

    const resource: any = response.body;
    expect(resource.resourceType).toEqual('OperationOutcome');
    expect(hasErrorMessage(resource)).toEqual(true)
    if (message != undefined) expect(errorMessageCheck(resource,message))
}

export function resourceCheckWarningMessage(response: any, message: string) {

    const resource: any = response.body;
    expect(resource.resourceType).toEqual('OperationOutcome');
    expect(hasWarningMessage(resource)).toEqual(true)
    if (message != undefined) expect(warningMessageCheck(resource,message))
}


export async function getPatient(): Promise<any> {
    const resource: any = await fs.readFileSync('Examples/pass/patient.json', 'utf8');
    return resource;
}

export async function getResource(file: string): Promise<any> {
    const resource: any = await fs.readFileSync(file, 'utf8');
    return resource;
}


export function getJson(file, resource) {
    var fileExtension = file.split('.').pop();
    if (fileExtension == 'xml' || fileExtension == 'XML') {
        var fhir = new Fhir();
        var json = fhir.xmlToJson(resource);
        if (JSON.parse(json).resourceType == undefined) throw Error('Invalid JSON Missing resource type '+ file)

        return json;
    } else {
       // console.log(file);
        if (JSON.parse(resource).resourceType == undefined) throw Error('Invalid JSON Missing resource type '+ file)
        if (JSON.parse(resource).resourceType == "Parameters") {
            var jsonResource = {
                "resourceType" : "Parameters",
                "parameter": [
                    {
                        "name": "resource",
                        "resource": JSON.parse(resource)
                    }
                ]
            };
            return JSON.stringify(jsonResource);
        }
        return resource;
    }

}

export async function downloadPackage(destinationPath, name,version ) {
    const url = 'https://packages.simplifier.net/' + name + '/' + version;
    console.log('Download from ' + url);
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        // @ts-ignore
        const buffer = Buffer.from(response.data, 'binary');

        fs.mkdirSync(path.join(__dirname,destinationPath ),{ recursive: true });
        fs.writeFileSync(path.join(__dirname,destinationPath + '/' + name +'-' + version + '.tgz'), buffer);
        console.log('Updated dependency ' + url);
    } catch (exception) {
        process.stderr.write(`ERROR received from ${url}: ${exception}\n`);
        throw new Error('Unable to download package '+url);
    }
}

function hasErrorMessage(resource): boolean  {
    const operationOutcome: OperationOutcome = resource;
    let warn=0;
    if (operationOutcome.issue !== undefined) {
        for (const issue of operationOutcome.issue) {
            switch (issue.severity) {
                case "error":
                case "fatal":
                    return true;
            }
        }
    }
    // if (warn>5) console.log("Warnings "+warn);
    return false;
}

function hasWarningMessage(resource): boolean  {
    const operationOutcome: OperationOutcome = resource;
    let warn=0;
    if (operationOutcome.issue !== undefined) {
        for (const issue of operationOutcome.issue) {
            switch (issue.severity) {
                case "warning":
                    return true;
            }
        }
    }
    return false;
}

function errorMessageCheck(resource, message) :boolean {
    const operationOutcome: OperationOutcome = resource;
    let warn=0;
    let errorMessage = 'None found';
    if (operationOutcome.issue !== undefined) {
        for (const issue of operationOutcome.issue) {

            switch (issue.severity) {
                case "error":
                case "fatal":
                    errorMessage = getErrorOrWarningFull(issue);
                    if (errorMessage.includes(message)) return true;
                case "warning":
                    if (raiseWarning(issue)) throw new Error(getErrorOrWarningFull(issue))
                    break;
            }
        }
    }
    throw new Error('Expected: ' + message + ' Found: '+errorMessage)
}

function warningMessageCheck(resource, message) :boolean {
    const operationOutcome: OperationOutcome = resource;
    let warn=0;
    let errorMessage = 'None found';
    if (operationOutcome.issue !== undefined) {
        for (const issue of operationOutcome.issue) {

            switch (issue.severity) {
                case "warning":
                    errorMessage = getErrorOrWarningFull(issue);
                    if (errorMessage.includes(message)) return true;
            }
        }
    }
    throw new Error('Expected: ' + message + ' Found: '+errorMessage)
}

function errorsCheck(resource) {
    const operationOutcome: OperationOutcome = resource;
    let warn=0;
    if (operationOutcome.issue !== undefined) {
        for (const issue of operationOutcome.issue) {

            switch (issue.severity) {
                case "error":
                case "fatal":
                    if (raiseError(issue)) throw new Error(getErrorOrWarningFull(issue))
                    break;
                case "warning":
                    if (raiseWarning(issue)) throw new Error(getErrorOrWarningFull(issue))
                    warn++;
                    break;
            }
        }
    }
   // if (warn>5) console.log("Warnings "+warn);

}

export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function wait(ms) {
    var start = Date.now(),
        now = start;
    while (now - start < ms) {
        now = Date.now();
    }
}

function getErrorOrWarningFull(issue: OperationOutcomeIssue) {
    let error = issue.diagnostics;
    if (issue.location != undefined) {
        for(let location of issue.location) {
            error += ' [ Location - ' + location + ']'
        }
    }
    return error;
}
function raiseWarning(issue: OperationOutcomeIssue): boolean {
    if (issue != undefined && issue.diagnostics != undefined) {
        if (issue.diagnostics.includes('incorrect type for element')) {
            return true;
        }
        if (issue.diagnostics.includes('Error HTTP 401')) {
            return true;
        }
        if (issue.diagnostics.includes('None of the codings provided are in the value set')) {
            if (issue.diagnostics.includes('http://snomed.info/sct')) {
                // Not defined in UKCore and valueset is extensible
                if (issue.diagnostics.includes('http://hl7.org/fhir/ValueSet/observation-methods')) return false
                // This has raised as an issue with UKCore https://simplifier.net/hl7fhirukcorer4/~issues/1839
                if (issue.diagnostics.includes('https://fhir.hl7.org.uk/ValueSet/UKCore-ImmunizationExplanationReason')) return false
                // This has been raised as an issue with UKCore https://simplifier.net/hl7fhirukcorer4/~issues/1840
                if (issue.diagnostics.includes('https://fhir.hl7.org.uk/ValueSet/UKCore-ReasonImmunizationNotAdministered')) return false
                if (issue.diagnostics.includes('https://fhir.hl7.org.uk/ValueSet/UKCore-MedicationCode (https://fhir.hl7.org.uk/ValueSet/UKCore-MedicationCode')) return false;
                // HAPI FHIR 5.7.0 version of above
                if (issue.diagnostics.includes('\'UK Core Medication Code\' (https://fhir.hl7.org.uk/ValueSet/UKCore-MedicationCode')) return false;

                return true;
            }
        }
        if (issue.diagnostics.includes('must be of the format')) {
            return true;
        }
    }
    return false;
}
function raiseError(issue: OperationOutcomeIssue) : boolean {
    if (issue != undefined && issue.diagnostics != undefined) {

        // List of errors to ignore
        if (issue.diagnostics.includes('could not be resolved, so has not been checked')) return false;
        // fault with current 5.5.1 validation
        if ( issue.diagnostics.includes('http://hl7.org/fhir/ValueSet/units-of-time')) return false;
        if ( issue.diagnostics.includes('NHSNumberVerificationStatus')) return false;
        if ( issue.diagnostics.includes('Validation failed for \'http://example.org/fhir')) return false;
        if ( issue.diagnostics.includes('Unrecognised property \'@fhir_comments')) return false;
        if (issue.diagnostics.includes('https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode')) return false;
        if (issue.diagnostics.includes('java.net.SocketTimeoutException')) {
            console.log(issue.diagnostics)
            return false
        }
    }
    return true;
}

