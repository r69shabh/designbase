import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";

const meta = {
  title: "Forms/Actions/Button",
  component: Button,
  parameters: { docs: { description: { component: "The one control for actions. Primary is for the single main action per view." } } },
  argTypes: {
    intent: { control: "select", options: ["primary", "secondary", "danger"], description: "Visual weight" },
    size: { control: { type: "radio" }, options: ["sm", "md", "lg"] },
  },
  args: { onClick: fn(), children: "Save changes" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { intent: "primary" } };
export const Secondary: Story = { args: { ...Primary.args, intent: "secondary" } };
export const Destructive: Story = { name: "Danger", args: { intent: "danger", children: "Delete project" } };
export const Loading: Story = { args: { loading: true } };
export const InAForm: Story = {
  render: (args) => (
    <form className="space-y-4">
      <Button {...args} />
    </form>
  ),
};
