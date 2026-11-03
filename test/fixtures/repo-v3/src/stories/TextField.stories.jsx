import TextField from "~/components/TextField";

export default {
  title: "Forms/TextField",
  component: TextField,
};

const Template = (args) => <TextField {...args} />;

export const Default = Template.bind({});
Default.args = { label: "Email", placeholder: "you@example.com" };

export const WithError = Template.bind({});
WithError.args = { ...Default.args, error: "That email is already taken" };
WithError.storyName = "With error";
