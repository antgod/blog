## 1. 选好的变量名注意事项
### 完全、准确的描述出变量所代表的事物
| 变量用途       | 好名字           |  坏名字  |
| ------------- |:-------------:| -----:|
| 到期的支付累计额 | runningTotal,checkTotal| written,ct,checks|
| 高速列车运行速度 | trainVelocity,volecityInMph|velt,v,train|
| 当前日期 | currentDate,todaysDate | cd,current,date |

### 使用计算机术语比业务领域术语反应"how"而非"what",在业务代码中避免使用，在框架代码中推荐使用

| 变量用途       | 计算机术语        |  业务术语  |
| ------------- |:-------------:| -----:|
| 员工记录 | inputRec | employeeData |
| 打印机状态 | bitFlag | printerReady |
| 求和 | calcVal | sum |
### 适当的名字长度
| 变量用途       | 太长        | 正好|
| ------------- |:-------------:| -----:|
| 参加奥林匹克运动会人员数量 | peopleOnUsolympicTeamNumber| numTeamMembres<br/>teamMemberCount |
| 体育场座位数 | numbrOfSeatsInStadium | seatCount<br/>numSeatsInStadium |
| 当代奥林匹克运动会要点记录 | recordOfPointsInMordernOlympics | teamPointsMax<br/>pointsRecord |
### 变量名对作用域的影响
1. 较长的名字适合用于很少使用的变量或者全局变量
2. 较短的名字用于局部变量或者循环变量。也经常会带来一些麻烦，尽量避免使用较短变量名。
3. 全局变量应该增加命名空间

### 变量名中的计算值限定词
如果你的变量中有限定词，如：
**total,sum,average,max,min,record,string,pointer**
,请把限定词放到最后

优点：

1. 主要含义的词显得最为突出
2. 避免totalRevenue、revenueTotal 产生歧义
3. 优雅的对称性。如*revenueTotal,expenseTotal,revenueAverage,expenseAverage*比*totalRevenue,totalExpense,averageRevenue,averageExpense*对称得多，后者几乎看不出什么规律来。

例外：

num限定词放在最后是约定俗成的。放在前面代表数量，放在后面代表序号。如numCustomer表示员工数量，customerNum代表当前员工序号。

### 常用对仗词
- begin/end
- first/last
- locked/unlocked
- min/max
- next/previous
- old/new
- opened/closed
- visible/invisible
- source/target
- source/destination
- up/down

## 2. 为特定类型数据命名
### 循环下标
1. 在循环嵌套时候，source[teamIndex][eventIndex]要比score[i][j]给出的信息更多
2. 如果一定要使用i,j,k，不要把他们用于简单循环的循环下标之外的任何场合。
### 状态变量

| 变量用途       | 坏名字           |  好名字  |
| ------------- |:-------------:| -----:|
| 数据是否准备完毕 | flag| dataReady |
| 字符类型 | statusFlag | characterType |
| 记录类型 | printFlag | reportType |
| 是否需要重计算 | computeFlag | recalcNeeded |

使用状态变量需要注意：

1. 状态值需要枚举值（常量），直接赋值更容易理解意义。
2. 状态值需要有初始值。

### 临时变量
避免使用temp之类的词标识临时变量，而应该使用有实际意义的词语，前面增加"_"命名
### 布尔变量
优秀变量名：
- done
- success/ok/error
- found

差的变量名：
- status:毫无意义
- isDone:可读性差，if(isFound)略差于if(found)
- notFound:如果取反，则变成!notFound，不如found/!found容易理解

### 枚举常量
1. 枚举：const Body_Color={Red,Green}
2. 常量：const BODY_COLOR={red,green}

## 3. 标准前缀

| UDT缩写      | 含义 |
| ------------- |:-------------:|
| ch | 字符 |
| doc | 文档 |
| pa | 段落 |
| scr | 屏幕区域 |
| sel | 选中范围 |
| wn | 窗体 |
| c | 数量 |
| i | 数组下标 |
| first | 数组中需要处理的第一个元素 |
| last | 数组中需要处理的最后一个元素 |
| lim | last+1 |
| max | 数组或列表最后一个元素 |
| min | 数组或列表第一个元素 |
| m | 成员变量 |
| g | 全局变量 |
| p | 指针 |

## 4. 可读性缩写
1. 字典里标准缩写
2. 去掉元音留3~4个辅音，如computer-cmptr,screen-scrn,apple-appl,integer-intgr
3. 使用每个单词第一个或者前几个字母
4. 去掉虚词and,or,the等，去掉后缀ing,ed等
5. 确保不会改变变量的意义
6. 所以要已一致，Num,No不能混用
7. 创建你能读出来的名字，xPos比xPstn好的多。如果无法说明代码，那不如改成前几个字母缩写。
8. 创建"标准缩写"文档说明所有说些

## 5. 避免使用的名字
1. 避免使用令人误解的名字或缩写：false不要作为Fig and almond season的缩写
2. 如果两个变量交换而不妨碍程序员对程序的理解，那则需要重命名了。如input与inputValue,recordNum和numRecords,以及fileNumber和fileIndex语义非常类似，很容易混淆。
3. 避免使用数字，如file1,file2
4. 避免拼写错单词，避免使用常常拼写错的单词，如absense,acsend,calender,reciept等。
5. 不要依靠大小写区分变量名
6. 避免使用容易混淆的字符。如果两个字符串非常相近，很难区分。如1和l，1和I，O和0，2和Z，S和5，G和6

## 6. 总结
1. 名字要尽量具体，避免太模糊或者太通用以及多种目的的名字通常都是不好的。
2. 命名应该能区分局部数据，类数据和全局数据。还可以区分类型名、常量、枚举和变量。
3. 无论做哪种类型项目，都应该遵守项目的命名规则。
4. 现代编程语言很少使用缩写。如果真的使用缩写，请使用项目缩写词典。
5. 代码阅读次数圆圆多余编码次数。确保名字更方便阅读而不是方便编写。

## 7. 检查
### 通用
1. 名字具备表达变量的含义了吗？
2. 反应社会问题而不是程序语言了吗？
3. 名字够长不用让你苦苦思索了吗？
4. 如果有限制词，放到最后了吗？
5. 使用count或者index代替num了吗？

### 特定数据命名
1. 嵌套循环的下标有意义吗？
2. 临时变量重命名了吗？
3. 布尔值为真时，变量名能准确表达含义吗？
4. 枚举类型有前缀吗？如Color_用于Color_Red,Color_Green等了吗？
5. 具名常量根据抽象实体而不是代表数字命名了吗？

### 命名规则
1. 规则能区分变量位置吗？
2. 规则能区分变量类型吗？
3. 为了可读性加以格式化了吗？
4. 与语言规则兼容了吗？

### 缩写
1. 有必要缩写吗？
2. 是否避免只节省一两个字符而缩写？
3. 所有单词缩写方式一致吗？
4. 易读性良好吗？
5. 避免使用容易看错或者混淆、读错的名字吗？
6. 有缩写对照表么？

### 避免
1. 容易让人误解的名字吗？
2. 有相近含义的名字吗？
3. 只有一两个字符不同的名字吗？
4. 发音相近的名字吗？
5. 包含数字的名字吗？
6. 为缩短而故意拼错的名字吗？
7. 与语言关键字冲突的名字吗？
8. 有过意随意或者难读懂的字符名字吗？