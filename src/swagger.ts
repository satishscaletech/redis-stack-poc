import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
/**
 * @description to create swagger documentation
 * @param app
 */
export async function swagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle(`redis-stack-poc`)
    .setDescription(
      'API Documentation\
     \n NOTE: The API with (LOCK) symbol can be used only after providing Login API response token in (Authorize)\
     \n -Parameter with * are required to execute related API',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'apiKey',
      scheme: 'basic',
      name: 'x-access-token',
      in: 'header',
    })
    .addBasicAuth({
      type: 'http',
      scheme: 'Basic',
      name: 'Authorization',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, options, {
    include: [],
    deepScanRoutes: true,
    // ignoreGlobalPrefix: true,
  });

  SwaggerModule.setup('swagger', app, document, {
    customSiteTitle: 'API',
    explorer: false,
  });
}
