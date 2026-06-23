# .continue/rules/CONTINUE.md

## Project Overview

The CONTINUE.md file provides a comprehensive guide for developers working on the project, covering key technologies, architecture, development workflow, and common tasks. It aims to help users understand how to use the project effectively and collaborate with their team.

### Getting Started

- **Prerequisites**: Ensure that you have access to the necessary tools such as `file_glob_search`, `read_file`, `ls`, and `create_new_file`. Activate these tools in Continue by selecting "Agent Mode" from the Mode Selector dropdown.
- **Installation Instructions**: Follow the installation instructions provided in the README file of the project. These may include setting up a virtual environment, installing dependencies, and configuring the build/deployment system.

### Project Structure

The project directory structure is organized as follows:

- `src/`: Contains the source code of the project.
  - **main.py**: The main entry point of the application.
  - **models/**: Contains the database models.
  - **services/**: Contains the business logic services.
  - **utils/**: Contains utility functions and classes.

### Development Workflow

1. **Coding Standards or Conventions**:
   - Follow the coding standards defined in the `.styleguide` file of the project. This may include indentation, line length, and naming conventions for classes and functions.
2. **Testing Approach**: Write tests using a testing framework like pytest to ensure that the code works as expected.
3. **Build and Deployment Process**:
   - Use `make build` to build the project, which compiles the source code into an executable.
   - Use `make deploy` to deploy the application to a server.

### Key Concepts

- **Domain-Specific Terminology**: Understand the specific terminology used in the domain of the project, such as "entity," "repository," and "service."
- **Core Abstractions**: Identify the core abstractions that make up the project, such as `User` and `Product`.
- **Design Patterns Used**: Familiarize yourself with design patterns like Singleton, Factory, and Observer.

### Common Tasks

1. **Running Tests**:
   - Use `make test` to run all tests. This will ensure that your changes do not introduce new bugs.
2. **Creating New Features**:
   - Follow the guidelines in `.styleguide` for creating new features. This may include using a code review process and updating documentation accordingly.
3. **Fixing Bugs**:
   - Track open issues on GitHub or Jira to prioritize bug fixes. Use `make fix <issue_number>` to apply patches.

### Troubleshooting

- **Common Issues**: Check the `.logs` directory for any error messages that may indicate what went wrong.
- **Debugging Tips**: Use logging to add more context and trace bugs back to their source. For example, use `logger.error("An error occurred: %s", message)`.

### References

- **Documentation**: Refer to the project's README file for full documentation on usage and configuration.
- **Official Resources**: Visit [GitHub](https://github.com/yourusername/projectname) or [Jira](https://jira.example.com/projects/PROJ) for official resources and support.

### Conclusion

The CONTINUE.md file provides a comprehensive guide for developers working on the project, covering key technologies, architecture, development workflow, and common tasks. It aims to help users understand how to use the project effectively and collaborate with their team. Make sure to review and edit the file as needed, commit it to your repository, and explain that Continue will automatically load this file into context when working with the project.