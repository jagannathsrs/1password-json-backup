import { OnePasswordConnect } from "@1password/connect";
import fs from "fs";

// Create new connector with HTTP Pooling
const op = OnePasswordConnect({
  serverURL: "http://localhost:8080",
  token: "your-token-goes-here",
  keepAlive: true,
});

async function backup() {
  try {
    let allVaults = await op.listVaults();
    const vaultIds: Array<any> = allVaults.map((v) => v.id);
    const data: Array<any> = [];

    for (const vaultId of vaultIds) {
      const items = await op.listItems(vaultId);
      const itemIds: Array<any> = items.map((item) => item.id);

      itemIds.forEach(async (item: string) => {
        const itemData = await op.getItem(vaultId, item);

        itemData.fields = itemData?.fields?.filter((field) => {
          return field.value !== undefined; //filter out fields with undefined values
        });

        itemData?.fields?.forEach((field: any, i) => {
          Object.keys(field).forEach((key) => {
            //filter out fields that are not reqiured
            if (
              [
                "id",
                "section",
                "type",
                "purpose",
                "generate",
                "recipe",
                "entropy",
              ].includes(key)
            ) {
              delete field[key];
            }
          });
          if (itemData && itemData.fields) {
            itemData.fields[i] = field;
          }
        });

        const currentVaultData = (({ title, category, fields }) => ({
          title,
          category,
          fields,
        }))(itemData);
        data.push(currentVaultData);
      });
    }

    fs.writeFile("1pass-backup.json", JSON.stringify(data), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      //file written successfully
    });
  } catch (e) {
    console.log(e);
  }
}

backup();
