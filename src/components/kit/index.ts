/**
 * Canonical UI catalog shared by T13 App Kit and T13 Site Kit.
 *
 * Base primitives are vendored from the public MIT repository
 * github.com/untitleduico/react (see third-party/untitledui-react/SOURCE.md);
 * layout, feedback compositions and blocks are original code written for the kits.
 * The files under tokens/, themes/, utils/, controls/, forms/, feedback/,
 * layout/ and the shared blocks are kept identical in both kits.
 *
 *   tokens/     design tokens (upstream, untouched)
 *   themes/     white-label overrides applied on top of the tokens
 *   utils/      class merging helpers
 *   controls/   button, checkbox, toggle
 *   forms/      input, label, hint, textarea, native select, pin input, form
 *   feedback/   alert, badge, tooltip
 *   layout/     named page widths and responsive compositions
 *   navigation/ application shell navigation
 *   blocks/     composed page-level building blocks
 */
export { Button } from "./controls/button";
export { Checkbox } from "./controls/checkbox";
export { Toggle } from "./controls/toggle";

export { Input, TextField } from "./forms/input";
export { Label } from "./forms/label";
export { HintText } from "./forms/hint-text";
export { TextArea } from "./forms/textarea";
export { NativeSelect } from "./forms/select-native";
export { PinInput } from "./forms/pin-input";
export { Form } from "./forms/form";

export { Alert } from "./feedback/alert";
export type { AlertTone } from "./feedback/alert";
export { Badge } from "./feedback/badge";
export type { BadgeTone } from "./feedback/badge";
export { Tooltip } from "./feedback/tooltip";

export { Container } from "./layout/container";

export { PageNav } from "./navigation/page-nav";
export type { NavLink } from "./navigation/page-nav";
export { PageFooter } from "./navigation/page-footer";

export { AccountSettings } from "./blocks/account-settings";
export { AuthCard } from "./blocks/auth-card";
export { CodeBlock } from "./blocks/code-block";
export { PageHeader } from "./blocks/page-header";
export { PageSection } from "./blocks/page-section";
export { Panel } from "./blocks/panel";
export { Showcase } from "./blocks/showcase";
export { SpecList } from "./blocks/spec-list";

export { cx } from "./utils/cx";

export {
  PageLayout,
  FormLayout,
  ArticleLayout,
  SidebarLayout,
  ContentGrid,
} from "./layout/layouts";
export { LayoutShowcase } from "./blocks/layout-showcase";
