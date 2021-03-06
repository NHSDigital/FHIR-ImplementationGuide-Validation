import {basePath, defaultBaseUrl, getJson, getPatient, resourceChecks} from "./common.js";

import * as fs from "fs";
import supertest from "supertest"
import {jest} from "@jest/globals";

const args = require('minimist')(process.argv.slice(2))
//const args = process.argv

let source = '../'
let examples: string



if (args!= undefined) {
    if (args['source']!= undefined) {
        source = args['source'];
    }
    if (args['examples']!= undefined) {
        examples = args['folder'];
    }
}


it('Validator is functioning ',async function () {
    await client().get('/metadata').expect(200)
});


const client = () => {
    const url = defaultBaseUrl
    return supertest(url)
}


function testFolder(dir) {

    if (fs.existsSync(dir)) {
        const list = fs.readdirSync(dir);
        list.forEach(function (file) {
            if (file.includes('.DS_Store')) return;
            file = dir + "/" + file;
            const resource: any = fs.readFileSync(file, 'utf8');

            it('Validate ' + file, async () => {
                // Initial terminology queries can take a long time to process - cached responses are much more responsive
                jest.setTimeout(40000)
                await client()
                    .post('/$validate')
                    .retry(3)
                    .set("Content-Type", 'application/fhir+json')
                    .set("Accept", 'application/fhir+json')
                    .send(getJson(file, resource))
                    .expect(200)
                    .then((response: any) => {
                        resourceChecks(response)
                    },
                        error => {
                            if (!error.message.includes('Async callback was not invoked within the')) throw new Error(error.message)
                        })
            });
        })
    }
}



    describe('Parsing supplied folder ', () => {
        if (examples != undefined) testFolder(examples);
    });

    describe('Parsing folder Appointment', () => {
        testFolder(source + 'Appointment');
    });

    describe('Parsing folder Bundle', () => {
        testFolder(source + 'Bundle');
    });
    describe('Parsing folder CapabilityStatement', () => {
        testFolder(source + 'CapabilityStatement');
    });

    describe('Parsing folder Claim', () => {
    testFolder(source + 'Claim');
    });

    describe('Parsing folder CodeSystem', () => {
        testFolder(source + 'CodeSystem');
    });

    describe('Parsing folder ConceptMap', () => {
        testFolder(source + 'ConceptMap');
    });

    describe('Parsing folder Examples', () => {
        testFolder(source + 'Examples');
    });

    describe('Parsing folder MessageDefinition', () => {
        testFolder(source + 'MessageDefinition');
    });

    describe('Parsing folder MedicationDispense', () => {
        testFolder(source + 'MedicationDispense');
    });

    describe('Parsing folder MedicationRequest', () => {
        testFolder(source + 'MedicationRequest');
    });

    describe('Parsing folder NamingSystem', () => {
        testFolder(source + 'NamingSystem');
    });

    describe('Parsing folder ObservationDefinition', () => {
        testFolder(source + 'ObservationDefinition');
    });

    describe('Parsing folder OperationDefinition', () => {
        testFolder(source + 'OperationDefinition');
    });

    describe('Parsing folder OperationOutcome', () => {
        testFolder(source + 'OperationOutcome');
    });


describe('Parsing folder Questionnaire', () => {
        testFolder(source + 'Questionnaire');
    });

    describe('Parsing folder Parameters', () => {
        testFolder(source + 'Parameters');
    });

    describe('Parsing folder SearchParameter', () => {
        testFolder(source + 'SearchParameter');
    });

    describe('Parsing folder ServiceRequest', () => {
        testFolder(source + 'ServiceRequest');
    });

    describe('Parsing folder StructureDefinition', () => {
        testFolder(source + 'StructureDefinition');
    });

    describe('Parsing folder StructureMap', () => {
        testFolder(source + 'StructureMap');
    });

    describe('Parsing folder Subscription', () => {
        testFolder(source + 'Subscription');
    });

    describe('Parsing folder Task', () => {
        testFolder(source + 'Task');
    });

    describe('Parsing folder ValueSet', () => {
        testFolder(source + 'ValueSet');
    });

// Begin UK Core folder names

    describe('Parsing folder codesystems', () => {
        testFolder(source + 'codesystems');
    });

    describe('Parsing folder conceptmaps', () => {
        testFolder(source + 'conceptmaps');
    });

    describe('Parsing folder examples', () => {
        testFolder(source + 'examples');
    });

    describe('Parsing folder examples', () => {
        testFolder(source + 'examples');
    });

    describe('Parsing folder structuredefinitions', () => {
        testFolder(source + 'structuredefinitions');
    });

    describe('Parsing folder valuesets', () => {
        testFolder(source + 'valuesets');
    });

// End UK Core folder names
/*
    describe('Testing validation api is functioning', () => {
        console.log(getPatient())
        it('validation functionality test', async () => {
            await client()
                .post('/$validate')
                .set("Content-Type", "application/fhir+json; fhirVersion=4.0.1")
                .set("Accept", "application/fhir+json")
                .send(getPatient())
                .expect(200)
        });
    });
*/




