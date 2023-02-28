import { FetchImagesFunction } from "../../httpClients/fetchImages.ts";

export interface RodosolApiContext {
  rodosolApi: {
    fetchImages: FetchImagesFunction;
  };
}
