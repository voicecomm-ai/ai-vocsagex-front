import { RSAKey } from "jsencrypt/lib/lib/jsbn/rsa";

export const rsa = (str) => {
  // rsa加密
  const pubKey =
    "afbcf39e663cfc51a4f89ab4403dff01a6405dab72b25922acd9fb08322e498f67e4838eca308b71df7e0e129ed30a2ca8fffd94bca4e5dbc8ec771730c5cd5facd1c7f3e16f0397d0702d32411ca67c6081f36b1201fef3859a308c18bf5c23edd0cdd3ffa67ace5c4bc8a5a582ce5c29ceb2deee7195d312d38eed1c0acfe5";
  const rsa = new RSAKey();
  rsa.setPublic(pubKey, "10001");
  return rsa.encrypt(str);
};
