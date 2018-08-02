!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n():"function"==typeof define&&define.amd?define(n):t.encodeMmtf=n()}(this,function(){"use strict";function t(t,n,r){return n?new t(n.buffer,n.byteOffset,n.byteLength/(r||1)):void 0}function n(n){return t(DataView,n)}function r(n){return t(Uint8Array,n)}function e(t,e){var i=t.length;e||(e=new Uint8Array(2*i));for(var o=n(e),s=0;i>s;++s)o.setInt16(2*s,t[s]);return r(e)}function i(t,e){var i=t.length;e||(e=new Uint8Array(4*i));for(var o=n(e),s=0;i>s;++s)o.setInt32(4*s,t[s]);return r(e)}function o(t,n,r){var e=t.length;r||(r=new Int32Array(e));for(var i=0;e>i;++i)r[i]=Math.round(t[i]*n);return r}function s(t){if(0===t.length)return new Int32Array;var n,r,e=2;for(n=1,r=t.length;r>n;++n)t[n-1]!==t[n]&&(e+=2);var i=new Int32Array(e),o=0,s=1;for(n=1,r=t.length;r>n;++n)t[n-1]!==t[n]?(i[o]=t[n-1],i[o+1]=s,s=1,o+=2):++s;return i[o]=t[t.length-1],i[o+1]=s,i}function u(t,n){var r=t.length;n||(n=new t.constructor(r)),n[0]=t[0];for(var e=1;r>e;++e)n[e]=t[e]-t[e-1];return n}function a(t,n){var r,e=n?127:32767,i=-e-1,o=t.length,s=0;for(r=0;o>r;++r){var u=t[r];0===u?++s:u>0?(s+=Math.ceil(u/e),u%e===0&&(s+=1)):(s+=Math.ceil(u/i),u%i===0&&(s+=1))}var a=n?new Int8Array(s):new Int16Array(s),c=0;for(r=0;o>r;++r){var u=t[r];if(u>=0)for(;u>=e;)a[c]=e,++c,u-=e;else for(;i>=u;)a[c]=i,++c,u-=i;a[c]=u,++c}return a}function c(t){return s(u(t))}function L(t,n){return s(o(t,n))}function d(t,n,r){return u(o(t,n),r)}function f(t,n,r){return a(d(t,n),r)}function h(t,n,r,e){var i=new ArrayBuffer(12+e.byteLength),o=new Uint8Array(i),s=new DataView(i);return s.setInt32(0,t),s.setInt32(4,n),r&&o.set(r,8),o.set(e,12),o}function l(t){var n=t.length,e=r(t);return h(2,n,void 0,e)}function v(t){var n=t.length,r=i(t);return h(4,n,void 0,r)}function m(t,n){var e=t.length/n,o=i([n]),s=r(t);return h(5,e,o,s)}function y(t){var n=t.length,r=i(s(t));return h(6,n,void 0,r)}function g(t){var n=t.length,r=i(c(t));return h(8,n,void 0,r)}function p(t,n){var r=t.length,e=i([n]),o=i(L(t,n));return h(9,r,e,o)}function I(t,n){var r=t.length,o=i([n]),s=e(f(t,n));return h(10,r,o,s)}function b(t){var n={};return A.forEach(function(r){void 0!==t[r]&&(n[r]=t[r])}),t.bondAtomList&&(n.bondAtomList=v(t.bondAtomList)),t.bondOrderList&&(n.bondOrderList=l(t.bondOrderList)),n.xCoordList=I(t.xCoordList,1e3),n.yCoordList=I(t.yCoordList,1e3),n.zCoordList=I(t.zCoordList,1e3),t.bFactorList&&(n.bFactorList=I(t.bFactorList,100)),t.atomIdList&&(n.atomIdList=g(t.atomIdList)),t.altLocList&&(n.altLocList=y(t.altLocList)),t.occupancyList&&(n.occupancyList=p(t.occupancyList,100)),n.groupIdList=g(t.groupIdList),n.groupTypeList=v(t.groupTypeList),t.secStructList&&(n.secStructList=l(t.secStructList)),t.insCodeList&&(n.insCodeList=y(t.insCodeList)),t.sequenceIndexList&&(n.sequenceIndexList=g(t.sequenceIndexList)),n.chainIdList=m(t.chainIdList,4),t.chainNameList&&(n.chainNameList=m(t.chainNameList,4)),n}var A=["mmtfVersion","mmtfProducer","unitCell","spaceGroup","structureId","title","depositionDate","releaseDate","experimentalMethods","resolution","rFree","rWork","bioAssemblyList","ncsOperatorList","entityList","groupList","numBonds","numAtoms","numGroups","numChains","numModels","groupsPerChain","chainsPerModel"],C=["xCoordList","yCoordList","zCoordList","groupIdList","groupTypeList","chainIdList","bFactorList","atomIdList","altLocList","occupancyList","secStructList","insCodeList","sequenceIndexList","chainNameList","bondAtomList","bondOrderList"];A.concat(C);return b});