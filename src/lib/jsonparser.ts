import { EdgeData, NodeData } from "reaflow";

const STATIC_TYPES = ["bigint", "boolean", "number", "string"];

const calculateSize = (text: string) => {
  const elt = document.createElement("div");
  const txt = document.createTextNode(text);

  elt.appendChild(txt);
  elt.style.whiteSpace = "pre";
  elt.style.visibility = "invisible";
  elt.style.display = "inline-block";

  document.body.appendChild(elt);

  const { clientWidth: width, clientHeight: height } = elt;

  document.body.removeChild(elt);

  return { width: width + 20, height: height + 20 };
};

const jsonparser = (jsonStr: string) => {
  const nodes: NodeData<any>[] = [];
  const edges: EdgeData<any>[] = [];

  const json = JSON.parse(jsonStr);

  function addNode(text: string, id: string) {
    const { width, height } = calculateSize(text);

    nodes.push({
      id: String(id),
      text,
      height,
      width,
    });
  }

  function nodeParser(obj: any, id: number, from?: number) {
    if (STATIC_TYPES.includes(typeof obj)) {
      addNode(obj, String(id));
      if (from) {
        edges.push({
          id: `${from}-${id}`,
          from: String(from),
          to: String(id),
        });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((value) => {
        id++;
        id = nodeParser(value, id, from);
      });
    } else {
      const staticKeys = Object.entries(obj)
        .filter(([_, value]) => STATIC_TYPES.includes(typeof value))
        .map(([key]) => key)
        .sort();

      let text = "";
      staticKeys.forEach((key) => {
        if (text) text += "\n";

        text += `${key}: ${obj[key]}`;
      });

      addNode(text, String(id));

      if (from) {
        edges.push({
          id: `${from}-${id}`,
          from: String(from),
          to: String(id),
        });
      }

      // Nested Types
      const nonStaticKeys = Object.entries(obj)
        .filter(([_, value]) => !STATIC_TYPES.includes(typeof value))
        .map(([key]) => key)
        .sort();

      let oldId = id;
      nonStaticKeys.forEach((key) => {
        id++;
        addNode(key, String(id));

        edges.push({
          id: `${oldId}-${id}`,
          from: String(oldId),
          to: String(id),
        });
        id = nodeParser(obj[key], id + 1, id);
      });
    }

    return id;
  }

  nodeParser(json, 1);

  return { nodes, edges };
};

export default jsonparser;