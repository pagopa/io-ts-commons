import { untag } from "../src/types";

// simple tag for testing
interface ITag {
  readonly kind: "ITag";
}

// T1 is a string tagged with ITag
type T1 = string & ITag;

// t1 is an "ITag" string
const t1: T1 = "t1" as T1;

// Resolves to A only if A extends B and B extends A (they are the same type)
type Equals<A, B> = A extends B ? (B extends A ? A : never) : never;

// t1untagged is t1 without its tag (back to a string)
const t1untagged = untag(t1);

// "x" should be assignable to "aString", since typeof t1untagged should be "string"
const aString: Equals<typeof t1untagged, string> = "x";
