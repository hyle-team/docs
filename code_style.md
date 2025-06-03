# Hyle C++ code-style requirements

Basis for our code-style is a book **“C++ Coding Standards” by Herb Sutter and Andrei Alexandrescu** (2004)  https://doc.lagout.org/programmation/C/CPP101.pdf This book must be read and taken as a “coding bible”. 

## Important rules

### C++ version
 - We use a subset of C++17 features.

### Formatting (religion)
 - Use spaces for indentation: 2 spaces = one tab. Don't use tab character.
 - Use snake_case, similar to boost/std libraries (excluding `MACROS`).
 - Put opening curly brace on a separate line.
 - Keep code readable. Comment briefly. Use meaningful names for variables and types to improve readability.
 - If you stumble across an old code that doesn’t meet these rules and you need to fix something, keep its formatting intact!
 - Don't use non-ASCII symbols.


### Git
 - All pull requests must be done to **develop** branch.
 - Commits should have a short and concise explanation of code changes.
 - Before making any pull requests, please make sure that ALL coretests and unit tests pass.
 - Avoid massive changes in a single commit, one feature/fix - one commit. 


### Safety
 - Type-safety is mandatory, C-style typecast should be used only in extremal cases.
 - **NEVER** use type-unsafe “format/printf”-like functions with variadic arguments list (not related to modern type-safe C++ versions of this functions).
 - **ALWAYS** initialize every variable/object. Stack and member variables. Old code uses AUTO_VAL_INIT(), new code (C++14/C++17) uses brace "{}" initializaion.
 - Critical sections should be used with CRITICAL_REGION_/CRITICAL_SECTION_*** macros (due to anti-deadlock manager).
After any code change, you need to check that core_tests and unit_tests are all pass successfully.
 - **DON'T** use singletons (yes, we have one in log system, but this is the only exception).

### Other books for right coding skills
 - Legendary book - Design Patterns: Elements of Reusable Object-Oriented Software by ErichGamma, RichardHelm, RalphJohnson, and JohnVlissides (the GangOfFour)
 - Modern C++ Design by Andrei Alexandrescu  https://erdani.com/index.php/books/modern-c-design/ 
 - Exceptional C++: 47 Engineering Puzzles, Programming Problems, and Solutions by Herb Sutter
 - Exceptional C++ Style: 40 New Engineering Puzzles, Programming Problems, and Solutions by Herb Sutter
 
(to be continued)
