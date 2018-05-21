// tslint:disable:no-duplicate-string

import { ApiRequestBuilder, IPostApiRequestType } from "../src/requests";

// --------

type R1 = IPostApiRequestType<
  {
    readonly param1: string;
    readonly param2: string;
  },
  "Content-Type",
  "query1" | "query2",
  string
>;

const r1: R1 = ApiRequestBuilder.ofPost()
  .withQuery((params: { readonly param1: string }) => ({
    query1: params.param1
  }))
  .withQuery((params: { readonly param2: string }) => ({
    query2: params.param2
  }))
  .withResponseDecoder(r => Promise.resolve("string"))
  .get();

// --------

type R2 = IPostApiRequestType<
  {
    readonly param1: string;
    readonly param2: string;
  },
  "Content-Type" | "Authorization",
  never,
  never
>;

const r2: R2 = ApiRequestBuilder.ofPost()
  .withHeaders((params: { readonly param1: string }) => ({
    "Content-Type": params.param1
  }))
  .withHeaders((params: { readonly param1: string }) => ({
    Authorization: params.param1
  }))
  .get();
