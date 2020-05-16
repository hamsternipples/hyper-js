
### easy things
- move new-project/architect into hyper (so everything needed to build hyper is here)
- make phx-lite Socket, Timer a closure instead of a class.


### uniform function call syntax (ufcs) plugin for rollup

see: [ufcs](https://en.wikipedia.org/wiki/Uniform_Function_Call_Syntax) for more info. this could be parsed in js using for example, the `#` to specify that it's ufcs syntax.

```js
var obj = {lala: 'hello', omg: 'world'}
function my_method (obj, hello, world) {
  var h = obj[hello]
  var w = obj[world]
  console.log(hello, world)
}
obj#my_method('lala', 'omg')
// > hello world
```

the line, `obj#my_method('lala', 'omg')` would get transformed automatically to `my_method(obj, 'lala', 'omg')`.

it seems like it may be possible, though some of the parsers spit out an error: [ast explorer](https://astexplorer.net/#/gist/04044a02639ade4e5e423758bebcefe5/ea46f037253933d96fe533b89faf99cdbf77c1f8)

since it's a parse error, and I already use `%` for some things, it may be possible to use `%`. another possiblity is to use the `|`, because or-statements are not really used.


### html parser

I want to make an html parser so that components can be written in a react style html like form with an accompanied script file. I think the best parser I've seen for this would be the one from @[uhtml](https://github.com/WebReflection/uhtml ), @[uparser](https://github.com/WebReflection/uparser)

I want them to look kinda like ractive style components so that it's an html file with a css and a script.

the other option is to use phoenix and do this in there. using time_machine, architect, and perhaps an html parser (https://github.com/dashbitco/nimble_parsec)
