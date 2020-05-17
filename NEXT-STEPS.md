
### easy things
- move new-project/architect into hyper (so everything needed to build hyper is here)
- make phx-lite Socket, Timer a closure instead of a class.
- make a generic version of channel.join().receive('ok', ...).receive('error', ...)


### rollup plugins

#### reuse primitives transformations
anything that's in @hyper/global, can be transformed.
that means that all the functions exported by global are tested to see if they exist in each file passing through the transform. if the ast is recognised, eg. `typeof val === 'string'` -> `is_str(val)` (and make sure to import is_str from @hyper/global)

next, any references that are exported in global will get imported so they have the advantage of being mangled to a smaller name.


#### uniform function call syntax (ufcs) plugin for rollup

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

#### const -> var converter

run this before, or extend the const-to-let plugin, so that when the const appears in a place other than a for-loop, and there are no conflicting variable names, convert it to a var instad of a let.

the reason is that var gets compressed a bit better because they are all defined at the topmost (program or function) scope, so they can be grouped together nicely, saving 3-4 bytes per definition.

### html parser

I want to make an html parser so that components can be written in a react style html like form with an accompanied script file. I think the best parser I've seen for this would be the one from @[uhtml](https://github.com/WebReflection/uhtml ), @[uparser](https://github.com/WebReflection/uparser)

I want them to look kinda like ractive style components so that it's an html file with a css and a script.

the other option is to use phoenix and do this in there. using time_machine, architect, and perhaps an html parser (https://github.com/dashbitco/nimble_parsec)
