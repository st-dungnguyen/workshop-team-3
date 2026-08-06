#### References

> Describe what it related

- [Task/Bug URL]()
- [Related PR URL]()

#### Description

> Describe what it implement
> Describe what it changed, added, removed

#### Screenshots
> UI screenshots for perfect pixel
> UI screenshots to show what is difference between before and after changing
> UI screenshots for Lighthouse reporting


#### Checklist

> Note: Developer is responsible for checking your own code according to this checklist.

##### Requirement:
- [ ] Run correctly as the requirement.
- [ ] All new and changes have enough test suites.

##### Coding:
- [ ] CI status is success (build success, all tests passed, no errors & warnings from linter).
- [ ] Application architecture & project structure are kept.
- [ ] Following coding conventions, coding standards.
- [ ] All errors were handled correctly.
- [ ] Meet 90%(at least) requirement of Lighthouse checking factors as default.


##### Performance:
- [ ] No infinity loop.
- [ ] Requires page load in under 3s
- [ ] No duplicated requests.
- [ ] Minimized duplicated components.
- [ ] No memory leak, no main thread blocking.


##### Security:
- [ ] No basic security flaws such as XSS, CSRF, Injection.
- [ ] No secret keys/tokens are written in the source code.
- [ ] No secret keys/tokens are compiled in the source build.
- [ ] No secret keys/tokens without restriction settings are used on the FE side.


##### UI/UX:
- [ ] Handle animation for hover, loading, processing behaviors.
