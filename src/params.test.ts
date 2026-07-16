import { buildMoodleParams } from "./params";

describe("buildMoodleParams", () => {
  it("serializes flat primitive values", () => {
    const params = buildMoodleParams({ id: 42, name: "Alice", active: true });

    expect(params.get("id")).toBe("42");
    expect(params.get("name")).toBe("Alice");
    expect(params.get("active")).toBe("1");
  });

  it("serializes booleans as 1/0", () => {
    const params = buildMoodleParams({ a: true, b: false });

    expect(params.get("a")).toBe("1");
    expect(params.get("b")).toBe("0");
  });

  it("omits null and undefined values at the top level", () => {
    const params = buildMoodleParams({ id: 1, missing: undefined, empty: null });

    expect(params.has("missing")).toBe(false);
    expect(params.has("empty")).toBe(false);
    expect(params.get("id")).toBe("1");
  });

  it("flattens arrays using bracket-index notation", () => {
    const params = buildMoodleParams({ courseids: [1, 2, 3] });

    expect(params.getAll("courseids[0]")).toEqual(["1"]);
    expect(params.get("courseids[1]")).toBe("2");
    expect(params.get("courseids[2]")).toBe("3");
  });

  it("flattens nested objects using bracket-key notation", () => {
    const params = buildMoodleParams({ options: { ids: [2, 3] } });

    expect(params.get("options[ids][0]")).toBe("2");
    expect(params.get("options[ids][1]")).toBe("3");
  });

  it("flattens arrays of objects", () => {
    const params = buildMoodleParams({
      users: [
        { id: 1, username: "alice" },
        { id: 2, username: "bob" },
      ],
    });

    expect(params.get("users[0][id]")).toBe("1");
    expect(params.get("users[0][username]")).toBe("alice");
    expect(params.get("users[1][id]")).toBe("2");
    expect(params.get("users[1][username]")).toBe("bob");
  });

  it("omits null/undefined values nested inside objects and arrays", () => {
    const params = buildMoodleParams({
      options: { ids: [1, undefined, 3], label: null },
    });

    expect(params.get("options[ids][0]")).toBe("1");
    expect(params.has("options[ids][1]")).toBe(false);
    expect(params.get("options[ids][2]")).toBe("3");
    expect(params.has("options[label]")).toBe(false);
  });

  it("returns an empty URLSearchParams when called with no params", () => {
    const params = buildMoodleParams();

    expect(Array.from(params.keys())).toHaveLength(0);
  });
});
