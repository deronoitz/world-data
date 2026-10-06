import { connectionUrl } from "../connection"

describe("connectionUrl", () => {
  it("drops channel_binding from a Neon URL and keeps everything else", () => {
    expect(
      connectionUrl(
        "postgresql://neondb_owner:p%40ss@ep-cool-1234-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      )
    ).toBe("postgresql://neondb_owner:p%40ss@ep-cool-1234-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require")
  })

  it("leaves other URLs unchanged", () => {
    expect(connectionUrl("postgresql://postgres:postgres@localhost:5432/world_data")).toBe(
      "postgresql://postgres:postgres@localhost:5432/world_data"
    )
  })

  it("passes through something that isn't a URL", () => {
    expect(connectionUrl("")).toBe("")
  })
})
