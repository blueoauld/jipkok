import Foundation

struct MemberFilterStore {

    private enum Key {
        static let sort = "member.sort"
        static let gender = "member.gender"
    }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var sort: MemberSort {
        get { defaults.string(forKey: Key.sort).flatMap(MemberSort.init(rawValue:)) ?? .recent }
        nonmutating set { defaults.set(newValue.rawValue, forKey: Key.sort) }
    }

    var gender: GenderFilter {
        get { defaults.string(forKey: Key.gender).flatMap(GenderFilter.init(rawValue:)) ?? .all }
        nonmutating set { defaults.set(newValue.rawValue, forKey: Key.gender) }
    }
}
