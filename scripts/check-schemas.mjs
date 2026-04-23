import {readFileSync} from "node:fs";
import {join} from "node:path";

const schemaNames = [
  "capability-descriptor",
  "execution-request",
  "execution-event",
  "evidence-record"
];

for (const name of schemaNames) {
  JSON.parse(
    readFileSync(
      join(process.cwd(), "schemas", `${name}.schema.json`),
      "utf8"
    )
  );
}

console.log("schemas ok");
