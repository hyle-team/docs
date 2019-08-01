# Hyle C++ code-style requirements

Basis for our code-style is a book **“C++ Coding Standards” by Herb Sutter and Andrei Alexandrescu** (2004)  https://doc.lagout.org/programmation/C/CPP101.pdf This book must be read and taken as a “coding bible”. 

## Important rules
### Formatting (religion):
 - Use spaces for indentation: 2 spaces = one tab.
 - Use snake_case, similar to boost/std libraries.
 - Put opening curly brace to a separate line.
 - If you faced with an old code that doesn’t meet these rules and you need to fix smth: keep it’s formatting intact!

### Git:
 - All pull reqests must be done to **develop** branch
 - Commits should have short and laconic explanation of code changes.
 - Before making any pull requests please make sure that ALL coretests and unit tests are passing
 - Avoid massive changes in one commit, one feature/fix - one commit. 


### Safety:
 - Type-safety is a mandatory, using of C-style typecast only in extremal cases.
 - **NEVER** use type-unsafe “format/printf”-like functions with var arguments list (not related to modern type-safe C++ version of this functions).
 - **ALWAYS** initialize every variable/object. Stack and member variables. We normally use AUTO_VAL_INIT() for that.
 - Critical sections should be used with CRITICAL_REGION_/CRITICAL_SECTION_*** macros (due to anti-deadlock manager).
After any code change you need to check that core_tests and unit_tests are all passed OK.

### Other books for right coding skills:
 - Legendary book - Design Patterns: Elements of Reusable Object-Oriented Software by ErichGamma, RichardHelm, RalphJohnson, and JohnVlissides (the GangOfFour)
 - Modern C++ Design by Andrei Alexandrescu  https://erdani.com/index.php/books/modern-c-design/ 
 - Exceptional C++: 47 Engineering Puzzles, Programming Problems, and Solutions by Herb Sutter
 - Exceptional C++ Style: 40 New Engineering Puzzles, Programming Problems, and Solutions by Herb Sutter
 
(to be continued)
