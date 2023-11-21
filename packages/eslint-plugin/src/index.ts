import { recommended } from './configs/recommended';
import * as rules from './rules';

const plugin = {
  rules: rules.rules,
  configs: {
    recommended,
  },
};

export default plugin;
