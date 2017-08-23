const mockGetRepo = jest.fn()
jest.mock("../../../db", () => ({
  default: { getRepo: mockGetRepo },
}))

const mockContents = jest.fn((token, repo, path) => {
  if (path === "dangerfile.issue") {
    return Promise.resolve("warn('issue worked')")
  }
})

jest.mock("../../../github/lib/github_helpers", () => ({ getGitHubFileContents: mockContents }))

import { readFileSync } from "fs"
import { resolve } from "path"
import { DangerRun, dangerRunForRules } from "../../../danger/danger_run"
import { GitHubInstallation } from "../../../db"
import { GitHubRunSettings, runEventRun, setupForRequest } from "../github_runner"

const apiFixtures = resolve(__dirname, "fixtures")
const fixture = file => JSON.parse(readFileSync(resolve(apiFixtures, file), "utf8"))

it("runs an Dangerfile for an issue with a local", async () => {
  mockGetRepo.mockImplementationOnce(() => Promise.resolve({ id: "123", fake: true }))

  const body = fixture("issue_comment_created.json")
  const req = { body, headers: { "X-GitHub-Delivery": "123" } } as any

  const settings = await setupForRequest(req)
  expect(settings.commentableID).toBeTruthy()

  const run = dangerRunForRules("issue_comment", "created", { issue_comment: "dangerfile.issue" })!

  const result = await runEventRun(run, settings, "token", body)
  // See above i nthe mock for the link
  expect(result!.warnings[0].message).toEqual("issue worked")
})

it("can handle a db returning nil for the repo with an Dangerfile for an issue with a local", async () => {
  mockGetRepo.mockImplementationOnce(() => Promise.resolve(null))

  const body = fixture("issue_comment_created.json")
  const req = { body, headers: { "X-GitHub-Delivery": "123" } } as any
  const settings = await setupForRequest(req)
  expect(settings.commentableID).toBeTruthy()

  const run = dangerRunForRules("issue_comment", "created", { issue_comment: "dangerfile.issue" })!

  const result = await runEventRun(run, settings, "token", body)
  // See above i nthe mock for the link
  expect(result!.warnings[0].message).toEqual("issue worked")
})
