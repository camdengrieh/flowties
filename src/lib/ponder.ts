import { createClient } from "@ponder/client";
import * as schema from "../../backend/ponder.schema";

const client = createClient("http://localhost:42069/sql", { schema });

export { client, schema }; 