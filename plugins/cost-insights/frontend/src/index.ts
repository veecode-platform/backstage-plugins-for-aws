/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';

export const CostInsightsIcon = MonetizationOnIcon;

export { costInsightsAwsPlugin } from './plugin';
export {
  CostInsightsProjectGrowthInstructionsPage,
  CostInsightsLabelDataflowInstructionsPage,
} from '@backstage-community/plugin-cost-insights';

export { CleanCostInsightsPage as CostInsightsPage } from './components/CleanCostInsightsPage';
export { CleanEntityCostCard as EntityCostInsightsContent } from './components/CleanEntityCostCard';
export { EntityClusterCostCard } from './components/EntityClusterCostCard';
