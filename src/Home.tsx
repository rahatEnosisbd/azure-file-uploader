import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const sasToken = process.env.REACT_APP_STORAGESASTOKEN;
const storageAccountName = process.env.REACT_APP_STORAGERESOURCENAME;


type FormType = {
  containerName: string,
  secondaryContainerName:string,
  picture: FileList
}

async function uploadFileAsBlob(containerClient:ContainerClient, secondaryContainerName:string, file:File) {
  const blobName = secondaryContainerName? `${secondaryContainerName}/${file.name}`:`${file.name}`
  const blobClient = containerClient.getBlockBlobClient(blobName);
  
  const options = { blobHTTPHeaders: { blobContentType: file.type } };
  
  await blobClient.uploadData(file, options);
}

async function saveData(data:FormType): Promise<string[]>
{
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
  );

  // create container if does not exist
   const primaryContainerClient: ContainerClient =
   blobServiceClient.getContainerClient(data.containerName);

  const primaryContainerExist = await primaryContainerClient.exists();

  if (!primaryContainerExist) {
    primaryContainerClient.create({
      access: "container",
    });
  }

  // const secondaryContainerClient: ContainerClient =
  //  new ContainerClient(`https://${storageAccountName}.blob.core.windows.net/${data.containerName}/${data.secondaryContainerName}`)

  // const secondaryContainerExist = await secondaryContainerClient.exists();

  // if (!secondaryContainerExist) {
  //   secondaryContainerClient.create({
  //     access: "container",
  //   });
  // }

  await uploadFileAsBlob(primaryContainerClient, data.secondaryContainerName, data.picture[0])

  const returnedBlobUrls: string[] = [];

  for await (const blob of primaryContainerClient.listBlobsFlat()) {
    returnedBlobUrls.push(
      `https://${storageAccountName}.blob.core.windows.net/${data.containerName}/${blob.name}`
    );
  }

  return returnedBlobUrls;
}

export function Home() {
  const  [ blobList, setBlobList] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const defaultVals = {containerName:"pictures", secondaryContainerName:""} as FormType
  const form = useForm({
    defaultValues: defaultVals
  });

  return (
    <>
      <h2>Welcome to the homepage!</h2>
      <form onSubmit={form.handleSubmit(async data => {
        setUploading(true)
        const blobListFromContainer = await saveData(data)
        console.log({blobListFromContainer})
        setBlobList(blobListFromContainer)
        setUploading(false)
        console.log(data)
      })}>
        Container Name: <input type="text" {...form.register("containerName", { required: "please enter this field" })} />
        <br />
        Secondary Container Name: <input type="text" {...form.register("secondaryContainerName", { required: "please enter this field" })} />
        <br />
        Upload<input type="file" {...form.register("picture", { required: "please enter this field" })} />
        <br />
        <button type="submit">Submit</button>
      </form>
      <br />
      {uploading?<h2>Uploading...</h2>: null}
      <br />
      <div>
      <h2>Container items</h2>
      <ul>
        {blobList.map((item) => {
          return (
            <li key={item}>
              <div>
                {item}
                <br />
                <img src={item} alt={item} height="200" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
    </>
  );
}