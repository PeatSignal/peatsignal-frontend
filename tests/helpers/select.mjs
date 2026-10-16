/** Choose through the visible custom menu, including menus portalled outside a form. */
export async function selectOption(control, selection) {
  await control.click();
  const list = control.page().getByRole("listbox").last();
  const option = typeof selection === "string"
    ? list.locator(`[role="option"][data-value="${selection}"]`)
    : list.getByRole("option", { name: selection.label, exact: typeof selection.label === "string" });
  await option.first().click();
}
