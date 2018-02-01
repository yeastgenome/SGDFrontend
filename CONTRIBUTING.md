# Contributing to SGD Frontend

The master branch should represent what is currently in production. We release on a monthly cycle, with the version number representing the current month and year. For example, 17.9.0 is the original release for September of 2017. In the event of a bug fix requiring release between monthly cycles, the minor minor number will be incremented, so a bug release on the aforementioned release would be 17.9.1.

During the monthly development cycle, the development branch will receive approved changes before they go into production. The development branch will be occasionally released to www.qa.yeastgenome.org during the cycle. Feature branches should be named corresponding to the redmine issue such as 1234_myissue. The number should be the beginning of the branch name, and extra words can be added after the number to help people remember what the issue is. The feature branches should be merged into the development branch as they become ready for testing. Feature branches can be deployed to development servers before merging into development as needed.

When the development branch is ready for release, it should be deployed to QA and staging, and then tested in both environments. Upon successful testing, development can be merged into master via a pull request. Once merged into the master branch, it can be deployed to the production environment. Once deployed, the release should be tagged and the release tag pushed to github, like this.

    $ git tag -a v17.9.0 -m "description of bug fixes"
    $ git push origin --tags
### Git flow
![Alt](https://github.com/yeastgenome/SGDBackend-Nex2/blob/qa/docs/SGD-Git-flow-example.png)
