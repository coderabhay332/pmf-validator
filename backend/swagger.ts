import swaggerJsdoc from 'swagger-jsdoc';
import * as YAML from 'yamljs';
import * as path from 'path';

// Load OpenAPI spec from YAML file
// __dirname will be 'dist' after compilation, so we need to go up one level to find swagger.yaml in the source directory
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));

export const specs = swaggerDocument;
