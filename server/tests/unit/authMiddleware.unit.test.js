const mongoose = require("mongoose");
const {
  createdByFilter,
  canModify,
} = require("../../middleware/authMiddleware");

describe("authMiddleware helpers", () => {
  const userId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();

  describe("createdByFilter", () => {
    it("returns empty object when req.user is missing", () => {
      expect(createdByFilter({})).toEqual({});
    });

    it("returns $or filter for legacy + owner when user present", () => {
      const filter = createdByFilter({ user: { _id: userId } });
      expect(filter.$or).toHaveLength(3);
      expect(filter.$or[2]).toEqual({ createdBy: userId });
    });
  });

  describe("canModify", () => {
    it("returns false without doc or user", () => {
      expect(canModify(null, { user: { _id: userId } })).toBe(false);
      expect(canModify({ _id: "x" }, {})).toBe(false);
    });

    it("allows legacy doc (no createdBy)", () => {
      expect(canModify({ createdBy: null }, { user: { _id: userId } })).toBe(
        true
      );
      expect(canModify({}, { user: { _id: userId } })).toBe(true);
    });

    it("allows owner only", () => {
      expect(
        canModify({ createdBy: userId }, { user: { _id: userId } })
      ).toBe(true);
      expect(
        canModify({ createdBy: otherId }, { user: { _id: userId } })
      ).toBe(false);
    });
  });
});
