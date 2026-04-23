export async function readFile(): Promise<never> {
  throw new Error('readFile is unavailable in the browser runtime.');
}

export default {
  readFile,
};
