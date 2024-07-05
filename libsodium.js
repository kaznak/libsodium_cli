#! /usr/bin/env node

const npmpkg = require("./package.json");

const { program } = require("commander");
const sodium = require("libsodium-wrappers");

function encrypt_gh_secret(key, value) {
  // Convert the secret and key to a Uint8Array.
  const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL),
    binsec = sodium.from_string(value),
    // Encrypt the secret using libsodium
    encBytes = sodium.crypto_box_seal(binsec, binkey),
    // Convert the encrypted Uint8Array to Base64
    output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
  return output;
}

program
  .name(npmpkg.name)
  .description(npmpkg.description)
  .version(npmpkg.version);

program
  .command("encrypt_gh_secret_json_map")
  .description("Encrypt a JSON map(Record<string,string | number>)")
  .argument("<encode_key>", "encryption key")
  .action((encode_key) => {
    //Check if libsodium is ready and then proceed.
    sodium.ready.then(() => {
      const stdin = process.stdin,
        stdout = process.stdout,
        inputChunks = [];

      stdin.on("data", function (chunk) {
        inputChunks.push(chunk);
      });

      stdin.on("end", function () {
        const inputJSON = inputChunks.join(),
          parsedData = JSON.parse(inputJSON),
          entries = Object.entries(parsedData),
          encEntries = entries.map(([key, value]) => [
            key,
            encrypt_gh_secret(encode_key, JSON.stringify(value)),
          ]),
          encData = Object.fromEntries(encEntries),
          outputJSON = JSON.stringify(encData);
        stdout.write(outputJSON);
        stdout.write("\n");
      });
    });
  });

program.parse();
