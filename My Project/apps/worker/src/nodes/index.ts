// Register all built-in nodes
// Each import registers nodes via nodeRegistry.register()
import "./triggers/manual.js";
import "./triggers/webhook.js";
import "./triggers/schedule.js";
import "./triggers/chat-message.js";
import "./logic/if-else.js";
import "./logic/switch.js";
import "./logic/merge.js";
import "./logic/filter.js";
import "./logic/loop.js";
import "./logic/wait.js";
import "./logic/set-variable.js";
import "./logic/math.js";
import "./logic/json-manipulator.js";
import "./data/http-request.js";
import "./data/graphql.js";
import "./ai/chat-completion.js";
import "./ai/embeddings.js";
import "./ai/vector-search.js";
import "./ai/text-splitter.js";
import "./ai/document-loader.js";
import "./ai/structured-output.js";
import "./ai/image-generation.js";
import "./code/javascript.js";
import "./code/python.js";
import "./code/template.js";
import "./integrations/index.js";
