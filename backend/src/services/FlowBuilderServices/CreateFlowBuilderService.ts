import * as Yup from "yup";
// import AWS from 'aws-sdk'
// import crypto from 'crypto'

import AppError from "../../errors/AppError";
import { SerializeUser } from "../../helpers/SerializeUser";
import FlowBuilder from "../../models/FlowBuilder";
import Plan from "../../models/Plan";
import Company from "../../models/Company";
import path from 'path'
import fs from 'fs'


interface InterfaceEdges {
  source: string;
  target: string;
}

interface InterfacePosition {
  x: number;
  y: number;
}

interface InterfaceOptions {
  id: string;
  number: string;
  text: string;
}

interface InterfaceSubData {
  text?: string;
  id?: string;
  title?: string;
  options?: InterfaceOptions[];
}

interface InterfaceData {
  type: string;
  data: InterfaceSubData;
}

interface InterfaceNodes {
  conditionalId?: string;
  id: string;
  nodeId?: string;
  optionId?: string;
  position: InterfacePosition;
  data: InterfaceData[];
}

interface Request {
  title: string;
  edges: InterfaceEdges[];
  nodes: InterfaceNodes[];
  companyId: number;
  imageContentType?: string;
}


const CreateFlowBuilderService = async ({
  title,
  nodes,
  edges,
  companyId,
}: Request): Promise<FlowBuilder> => {
  console.log({
    title,
    nodes: nodes[0].data[0].type === 'image',
    edges,
    companyId,
    })

    // const createImageKey = async (base64: any, imageContentType: string): Promise<string> => {
    //   return new Promise((resolve, reject) => {
    //     const config = new AWS.Config({
    //       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    //       region: process.env.AWS_REGION,
    //     });
    //     const s3 = new AWS.S3(config);

    //     const fileHash = crypto.randomBytes(10).toString('hex');
    //     const Key = `${fileHash}-${title.split('.')[0].replace('webp', '')}.${imageContentType.replace('image/', '')}`;
    //     const avatarFile = base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    //     const binaryData = Buffer.from(avatarFile, 'base64');
    //     const params = {
    //       Bucket: `${process.env.S3_BUCKET_NAME}/uploads-flows`,
    //       Key,
    //       Body: binaryData,
    //       ContentType: `${imageContentType}`,
    //     };

    //     s3.putObject(params, function (err: any, data: any) {
    //       if (data) {
    //         resolve(Key);
    //       } else {
    //         console.log({erroOnUpload: err})
    //         reject(new AppError('Fail to upload image'));
    //       }
    //     });
    //   });
    // };
    const saveImaggeData = (base64: any, imageContentType: string) => {
      try {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

        const buffer = Buffer.from(base64Data, 'base64');

        const imagePath = path.join(__dirname, '../..', 'uploads-flowbuilder', `${Date.now()}.${imageContentType.replace('image/', '')}`);

        fs.writeFileSync(imagePath, buffer);

        return `${process.env.BACKEND_URL}/uploads-flowbuilder/${path.basename(imagePath)}`

      } catch (error) {
        console.log({ErroImagemUpload: error})
      }

    }


    if (companyId !== undefined) {
      const company = await Company.findOne({
        where: {
          id: companyId
        },
        include: [{ model: Plan, as: "plan" }]
      });

      // if (company !== null) {
      //   // const usersCount = await FlowBuilder.count({
      //   //   where: {
      //   //     companyId
      //   //   }
      //   // });

      //   // if (usersCount >= company.plan.flows) {
      //   //   throw new AppError(
      //   //     `Número máximo de fluxos já alcançado: ${usersCount}`
      //   //   );
      //   // }
      // }
      if (!company) {
        throw new AppError(
          'Company not found!'
        );
      }

      const schema = Yup.object().shape({
        title: Yup.string().required(),
        edges: Yup.array().of(
          Yup.object().shape({
            source: Yup.string().required(),
            target: Yup.string().required()
          })
        ),
        nodes: Yup.array().of(
          Yup.object().shape({
            conditionalId: Yup.string().nullable(),
            id: Yup.string().required(),
            nodeId: Yup.string().nullable(),
            optionId: Yup.string().nullable(),
            position: Yup.object().shape({
              x: Yup.number().required(),
              y: Yup.number().required()
            }),
            data: Yup.array().of(
              Yup.object().shape({
                type: Yup.string().required(),
                data: Yup.object().shape({
                  text: Yup.string().nullable(),
                  id: Yup.string().nullable(),
                  title: Yup.string().nullable(),
                  options: Yup.array().of(
                    Yup.object().shape({
                      id: Yup.string().required(),
                      number: Yup.string().required(),
                      text: Yup.string().required()
                    })
                  ).nullable()
                })
              })
            )
          })
        ),
        companyId: Yup.number().required()
      });

    try {
      await schema.validate({
        title,
        nodes,
        edges,
        companyId,
      });
      // nodes.forEach(async (node) => {
      //   // Mapear os objetos de data dentro de cada node
      //   node.data.forEach(async (item) => {
      //     // Verificar se o type é 'image'
      //     if (item.type === 'image') {
      //       // Criar a chave da imagem e substituir o valor de text
      //       const base64 = item.data.text.split('@@@@')[1]
      //       const imageContentType = item.data.text.split('@@@@')[0]
      //       item.data.text = await createImageKey(base64, imageContentType);
      //     }
      //   });
      // });
      await Promise.all(nodes.map(async (node) => {
        // Mapear os objetos de data dentro de cada node
        await Promise.all(node.data.map(async (item) => {
          // Verificar se o type é 'image'
          if (item.type === 'image') {
            // Criar a chave da imagem e substituir o valor de text
            const base64 = item.data.text.split('@@@@')[1];
            const imageContentType = item.data.text.split('@@@@')[0];
            item.data.text = saveImaggeData(base64, imageContentType);
          }
        }));
      }));
      const flow = await FlowBuilder.create(
        {
          title,
          nodes,
          edges,
          companyId,
        }
        // { include: ["company"] }
      );

      // await flow.reload();
      return flow;
    } catch (err) {
      throw new AppError(err.message);
    }


    };
}

export default CreateFlowBuilderService
