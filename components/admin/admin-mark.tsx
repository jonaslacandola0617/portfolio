/** Admin wordmark: the site's three-node mark plus "Admin". */
export function AdminMark() {
  return (
    <div className="admin-mark" aria-label="Jonas Lacandola admin">
      <span className="admin-mark-glyph" aria-hidden="true"><i /><i /><i /></span>
      <span className="admin-mark-name">Jonas <em>Admin</em></span>
    </div>
  );
}
