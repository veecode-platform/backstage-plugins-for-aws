> **This repository is retired (2026-09).** Its actively-maintained code has migrated:
>
> - Cost Insights backend + shared commons → [`devportal-plugins`](https://github.com/veecode-platform/devportal-plugins), workspace `aws-cost-insights`
> - `catalog-aws-s3` module → [`devportal-plugins`](https://github.com/veecode-platform/devportal-plugins), workspace `aws-s3-catalog`
> - GenAI dynamic-export patches → `devportal-plugin-export-overlays`, `workspaces/backstage-plugins-for-aws/patches-dormant/`
> - ECS, CodeBuild, and CodePipeline plugins are now built directly from upstream [`awslabs/backstage-plugins-for-aws`](https://github.com/awslabs/backstage-plugins-for-aws) — no fork-specific patches remain for them
>
> Decision record: ADR-011 (`devportal-planning`). This repository remains clonable for reference; commit `cf408c11` stays resolvable.

---

# Backstage plugins for AWS

Welcome to the AWS plugins for Backstage project! The goal of this project is to provide granular, composable plugins for [backstage.io](https://backstage.io) that integrate to various AWS services, as well as providing utility functions to make it easier to create custom plugins.

## Usage

To understand how to start using these plugins in your Backstage environment please see the [Getting Started](./docs/getting-started.md) guide.

For detailed documentation regarding each plugin please see below:

| Plugin                    | Documentation                                       | Description                                                                                    |
| ------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scaffolder actions        | [Link](./plugins/core/scaffolder-actions/README.md) | Custom scaffolder actions related to AWS services.                                             |
| Amazon ECS                | [Link](./plugins/ecs/README.md)                     | Shows information related to Amazon Elastic Container Service services and tasks.              |
| Amazon ECR                | [Link](./plugins/ecr/README.md)                     | Shows information related to Amazon Elastic Container Registry repositories and images.        |
| AWS CodePipeline          | [Link](./plugins/codepipeline/README.md)            | Show the status of AWS CodePipeline pipelines on the entity page.                              |
| AWS CodeBuild             | [Link](./plugins/codebuild/README.md)               | Show the status of AWS CodeBuild projects on the entity page.                                  |
| AWS Config catalog module | [Link](./plugins/core/catalog-config/README.md)     | Module that implements an entity provider to ingest AWS resources in to the Backstage catalog. |
| Generative AI             | [Link](./plugins/genai/README.md)                   | Build assistants powered by Generative AI                                                      |
| Cost Insights for AWS     | [Link](./plugins/cost-insights/README.md)           | An implementation of the Cost Insights plugin that provides AWS cost information               |
| AWS Security Hub          | [Link](./plugins/securityhub/README.md)             | View and manage AWS Security Hub findings for your resources on the entity page.               |

## Security

For information about contributing and reporting security issues, see [CONTRIBUTING](CONTRIBUTING.md).

## License

This project is licensed under the Apache-2.0 License.
