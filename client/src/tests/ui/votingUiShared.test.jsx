import {
  initials,
  nomineeAvatarClass,
} from "../../components/voting/VotingUiShared";

describe("VotingUiShared helpers (UI/unit)", () => {
  describe("initials", () => {
    it("combines first and last initials", () => {
      expect(initials("Jane", "Doe")).toBe("JD");
    });

    it("duplicates first when last missing", () => {
      expect(initials("Madonna", "")).toBe("MM");
    });

    it("handles empty names with placeholder", () => {
      expect(initials("", "")).toBe("??");
    });
  });

  describe("nomineeAvatarClass", () => {
    it("alternates navy and blush modifier classes", () => {
      expect(nomineeAvatarClass(0)).toContain("ballot-avatar--navy");
      expect(nomineeAvatarClass(1)).toContain("ballot-avatar--blush");
    });
  });
});
